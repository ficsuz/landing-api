import { ErrorCodes } from '@common/constants/error-codes';
import { AppException } from '@common/exceptions/app.exception';
import { IUser } from '@modules/users/interfaces/user.interface';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = await super.canActivate(context);
    if (!parentCanActivate) {
      return false;
    }
    return true;
  }

  handleRequest<TUser = IUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest();

    if (err || !user) {
      throw new AppException(ErrorCodes.TOKEN_INVALID, { cause: err });
    }

    request.user = user;

    return user;
  }
}
