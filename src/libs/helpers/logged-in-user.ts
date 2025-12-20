import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface LoggedInUser {
  sub: string;
  userId?: bigint;
  username?: string;
}

export interface RequestWithUser {
  user: LoggedInUser;
}

export const extractLoggedInUser = (req: any): LoggedInUser => {
  return {
    sub: req.user?.sub || req.user?.userId?.toString() || '',
    userId: req.user?.userId || req.userId,
    username: req.user?.username || req.username,
  };
};

export const LoggedInUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return extractLoggedInUser(request);
  },
);
