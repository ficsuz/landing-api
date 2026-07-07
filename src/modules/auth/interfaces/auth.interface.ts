import { IUser } from '@modules/users/interfaces/user.interface';

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface ITokenPayload {
  id: string;
  email: string;
  sessionId: string;
  isVerified?: boolean;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface IUserSession extends IUser {
  id: string;
  fullName: string;
  email: string;
  userId: string;
  sessionId?: string;
  isVerified: boolean;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
