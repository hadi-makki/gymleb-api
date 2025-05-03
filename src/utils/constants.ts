import { CookieOptions } from 'express';
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'none',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};
