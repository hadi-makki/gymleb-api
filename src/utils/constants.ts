import { CookieSerializeOptions } from '@fastify/cookie';

export const cookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};
