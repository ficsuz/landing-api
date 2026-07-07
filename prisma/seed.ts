import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { ROLES, PERMISSION_KEYS } from '../src/common/constants';

// Create PostgreSQL connection following documentation best practices
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
  errorFormat: 'minimal',
});

// Permission keys excluded from the `admin` role (only super_admin keeps these).
const ADMIN_EXCLUDED_KEYS = new Set(['role:delete', 'permission:delete']);

// Permission keys granted to the baseline `user` role (kept minimal: read-only on self).
const USER_KEYS = new Set(['user:read']);

interface RoleDefinition {
  name: string;
  description: string;
  permissionKeys: string[];
}

const roleDefinitions: RoleDefinition[] = [
  {
    name: ROLES.SUPER_ADMIN,
    description: 'Super Administrator with full system access',
    permissionKeys: [...PERMISSION_KEYS],
  },
  {
    name: ROLES.ADMIN,
    description: 'Administrator with limited management rights',
    permissionKeys: PERMISSION_KEYS.filter((key) => !ADMIN_EXCLUDED_KEYS.has(key)),
  },
  {
    name: ROLES.USER,
    description: 'Standard user with minimal access',
    permissionKeys: PERMISSION_KEYS.filter((key) => USER_KEYS.has(key)),
  },
];

async function main(): Promise<void> {
  // Idempotent cleanup of join tables so re-running can't leave stale links.
  // Only reference models that still exist in the schema.
  await prisma.rolePermissions.deleteMany();
  await prisma.userRoles.deleteMany();

  // ── Permissions ───────────────────────────────────────────────
  // Upsert one row per catalog key. Identity is `key`.
  const permissionIdByKey = new Map<string, string>();
  for (const key of PERMISSION_KEYS) {
    const [resource, action] = key.split(':');
    const permission = await prisma.permissions.upsert({
      where: { key },
      update: { resource, action, description: `Can ${action} ${resource}` },
      create: { key, resource, action, description: `Can ${action} ${resource}` },
    });
    permissionIdByKey.set(key, permission.id);
  }

  // ── Roles + RolePermissions ───────────────────────────────────
  const roleIdByName = new Map<string, string>();
  for (const def of roleDefinitions) {
    const role = await prisma.roles.upsert({
      where: { name: def.name },
      update: { description: def.description, isSystem: true },
      create: { name: def.name, description: def.description, isSystem: true },
    });
    roleIdByName.set(def.name, role.id);

    const rolePermissions = def.permissionKeys
      .map((key) => permissionIdByKey.get(key))
      .filter((permissionId): permissionId is string => permissionId !== undefined)
      .map((permissionId) => ({ roleId: role.id, permissionId }));

    if (rolePermissions.length > 0) {
      await prisma.rolePermissions.createMany({
        data: rolePermissions,
        skipDuplicates: true,
      });
    }
  }

  // ── Admin user (from env, no personal data) ───────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!', 10);

  const adminUser = await prisma.users.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'Administrator',
      password: adminPassword,
      isVerified: true,
      authMethod: 'local',
      provider: 'local',
    },
    create: {
      email: adminEmail,
      fullName: 'Administrator',
      password: adminPassword,
      isVerified: true,
      authMethod: 'local',
      provider: 'local',
    },
  });

  // Link admin to super_admin via UserRoles composite-key row (idempotent).
  const superAdminRoleId = roleIdByName.get(ROLES.SUPER_ADMIN);
  if (superAdminRoleId) {
    await prisma.userRoles.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRoleId } },
      update: {},
      create: { userId: adminUser.id, roleId: superAdminRoleId },
    });
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
