export interface IRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  isDeleted?: boolean;

  permissions?: IPermission[];

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  // User IDs
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
}

export interface IPermission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateRoleDto {
  name: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
}

export interface IUpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
}
