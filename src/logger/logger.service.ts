import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLogEntity } from 'src/request-logs/request-log.entity';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(RequestLogEntity)
    private readonly logsRepo: Repository<RequestLogEntity>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, baseUrl } = req;
    const start = Date.now();

    const getColor = (statusCode: number) => {
      if (statusCode >= 500) return '\x1b[31m'; // Red
      if (statusCode >= 400) return '\x1b[33m'; // Yellow
      if (statusCode >= 300) return '\x1b[36m'; // Cyan
      if (statusCode >= 200) return '\x1b[32m'; // Green
      return '\x1b[37m'; // White
    };

    const getClientIp = (): string => {
      const xff = req.headers['x-forwarded-for'] as
        | string
        | string[]
        | undefined;
      if (Array.isArray(xff) && xff.length > 0) {
        return xff[0].split(',')[0].trim();
      }
      if (typeof xff === 'string' && xff.length > 0) {
        return xff.split(',')[0].trim();
      }
      if (req.ip) return req.ip as string;
      if (req.socket?.remoteAddress) return req.socket.remoteAddress as string;
      return 'unknown';
    };

    const slowThresholdMs = parseInt(
      process.env.REQUEST_LOG_SLOW_THRESHOLD_MS || '600',
      10,
    );

    res.on('finish', async () => {
      try {
        const { statusCode } = res;
        const duration = Date.now() - start;
        const color = getColor(statusCode);
        const ip = getClientIp();

        Logger.log(
          `${color}${method} ${baseUrl} ${statusCode} - ${duration}ms - IP: ${ip}\x1b[0m`,
        );

        const isError = statusCode >= 500;
        const isSlow = duration >= slowThresholdMs;
        if (isError || isSlow) {
          const deviceId = (req.cookies && req.cookies['deviceId_v1']) || null;
          // Try to keep payloads reasonably small
          const safeStringify = (obj: unknown) => {
            try {
              const str = JSON.stringify(obj);
              return str.length > 8000 ? str.slice(0, 8000) : str;
            } catch (e) {
              return null;
            }
          };

          const log = this.logsRepo.create({
            method,
            url: baseUrl,
            statusCode,
            durationMs: duration,
            deviceId,
            ip,
            country: (req.headers['cf-ipcountry'] as string) || null,
            city: (req.headers['x-vercel-ip-city'] as string) || null,
            headers: safeStringify(req.headers),
            requestBody: safeStringify(req.body),
            queryParams: safeStringify(req.query),
            routeParams: safeStringify(req.params),
            isError,
            isSlow,
          });
          await this.logsRepo.save(log);
        }
      } catch (err) {
        Logger.error('Failed to persist request log', err);
      }
    });

    next();
  }
}
