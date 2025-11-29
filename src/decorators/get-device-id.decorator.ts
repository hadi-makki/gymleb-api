import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CookieNames } from 'src/utils/constants';

export const GetDeviceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.cookies[CookieNames.DeviceId] ||
      request.headers[CookieNames.DeviceId]
    );
  },
);
