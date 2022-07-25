import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserService } from './user.service';

export const User = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userService = new UserService();
    const is_ambassador = request.path.toString.indexOf('/api/ambassador') >= 0;
    const scope = is_ambassador ? 'ambassador' : 'admin';
    return await userService.get('user', {},request.cookies['jwt']);
  },
);