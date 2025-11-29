import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CookieNames, cookieOptions } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async use(req: Request, res: Response, next: NextFunction) {
    // if (process.env.NODE_ENV === 'local') {
    //   await this.delay(1000);
    // }
    const deviceId =
      req.cookies[CookieNames.DeviceId] ||
      req.headers[CookieNames.DeviceId.toLowerCase()];

    if (!deviceId) {
      const newDeviceId = uuidv4();
      res.cookie(CookieNames.DeviceId, newDeviceId, cookieOptions);
      res.setHeader(CookieNames.DeviceId, newDeviceId);
      // we need to remove the old device id
      // res.clearCookie('deviceId', cookieOptions);
      // res.clearCookie('memberToken', cookieOptions);
      // res.clearCookie('token', cookieOptions);
      // Also set it on the request for immediate access in this request
      req.cookies[CookieNames.DeviceId] = newDeviceId;
      req.headers[CookieNames.DeviceId] = newDeviceId;
    }

    if (req.headers[CookieNames.DeviceId.toLowerCase()]) {
      req.cookies[CookieNames.DeviceId] =
        req.headers[CookieNames.DeviceId.toLowerCase()];
    }

    next();
  }
}
