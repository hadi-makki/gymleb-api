import { Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IncomingMessage } from 'http';

export function loggerMiddleware(
  req: FastifyRequest['raw'],
  res: FastifyReply['raw'],
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

  const { statusCode } = res;
  const duration = Date.now() - start;
  const color = getColor(statusCode);

  Logger.log(`${color}${method} ${url} ${statusCode} - ${duration}ms\x1b[0m`);

  next();
}
