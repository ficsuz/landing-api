import { IPermission, IRole } from '@modules/roles/interfaces/role.interface';

export interface IUser {
  id: string;
  email: string;
  password?: string;
  fullName?: string;
  isVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: IRole[];
  permissions?: IPermission[];
  blockedAt?: Date | null;
}

export interface ICreateUserDto {
  email: string;
  password: string;
  fullName: string;
}

export interface IUpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
}
