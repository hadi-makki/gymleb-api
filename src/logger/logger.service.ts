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

  // Listen for the response to finish before logging
  res.on('finish', () => {
    const { statusCode } = res;
    const duration = Date.now() - start;
    const color = getColor(statusCode);

    Logger.log(`${color}${method} ${url} ${statusCode} - ${duration}ms\x1b[0m`);
  });

  next();
}
