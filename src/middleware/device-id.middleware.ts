import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { cookieOptions } from 'src/utils/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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
