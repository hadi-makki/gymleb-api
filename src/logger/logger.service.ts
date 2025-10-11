import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: () => void,
) {
  const { method, url } = req;
  const start = Date.now();

  const getColor = (statusCode: number) => {
    if (statusCode >= 500) return '\x1b[31m'; // Red
    if (statusCode >= 400) return '\x1b[33m'; // Yellow
    if (statusCode >= 300) return '\x1b[36m'; // Cyan
    if (statusCode >= 200) return '\x1b[32m'; // Green
    return '\x1b[37m'; // White
  };

  const getClientIp = (): string => {
    const xff = req.headers['x-forwarded-for'] as string | string[] | undefined;
    if (Array.isArray(xff) && xff.length > 0) {
      return xff[0].split(',')[0].trim();
    }
    if (typeof xff === 'string' && xff.length > 0) {
      return xff.split(',')[0].trim();
    }
    if (req.ip) return req.ip;
    if (req.socket?.remoteAddress) return req.socket.remoteAddress;
    return 'unknown';
  };

  // Listen for the response to finish before logging
  res.on('finish', () => {
    const { statusCode } = res;
    const duration = Date.now() - start;
    const color = getColor(statusCode);

    Logger.log(
      `${color}${method} ${url} ${statusCode} - ${duration}ms - IP: ${getClientIp()}\x1b[0m`,
    );
  });

  next();
}
