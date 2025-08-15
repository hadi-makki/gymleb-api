import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = isProduction
  ? 'https://api.gym-leb.com'
  : 'http://localhost:3000';

export const cookieOptions: CookieOptions = {
  httpOnly: true, // not accessible from JS
  secure: true, // requires HTTPS
  sameSite: 'lax', // prevent CSRF attacks
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  domain: cookieDomain,
};
