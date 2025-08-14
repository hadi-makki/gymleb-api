import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeviceIdInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const deviceId = request.cookies['deviceId'];
    if (!deviceId) {
      const newDeviceId = uuidv4();
      response.cookie('deviceId', newDeviceId, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });
    }
    return next.handle();
  }
}
