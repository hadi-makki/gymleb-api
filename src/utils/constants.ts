import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = isProduction
  ? process.env.COOKIE_DOMAIN
  : process.env.LOCAL_COOKIE_DOMAIN;

export const cookieOptions: CookieOptions = {
  httpOnly: true, // not accessible from JS
  secure: true, // requires HTTPS
  sameSite: 'lax', // prevent CSRF attacks
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  // cookie domain should look like this: .gymleb.com
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};
