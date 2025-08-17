import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { cookieOptions } from 'src/utils/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'local') {
      await this.delay(1000);
    }
    const deviceId = req.cookies['deviceId'];

    if (!deviceId) {
      const newDeviceId = uuidv4();
      res.cookie('deviceId', newDeviceId, cookieOptions);
      // Also set it on the request for immediate access in this request
      req.cookies['deviceId'] = newDeviceId;
    }

    next();
  }
}
