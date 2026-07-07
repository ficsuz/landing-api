import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { Request } from 'express';

export interface IRequest extends Request {
  user?: IUserSession;
}
