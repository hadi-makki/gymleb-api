import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'prod';

// Allow overriding via env for maximum compatibility
const envSameSite = (process.env.COOKIE_SAMESITE || '').toLowerCase();
const resolvedSameSite: CookieOptions['sameSite'] =
  envSameSite === 'strict' ? 'strict' : envSameSite === 'none' ? 'none' : 'lax'; // default to lax for widest browser support

// If SameSite=None is used, Secure must be true on modern browsers.
// Also allow explicit override via COOKIE_SECURE=true.
const resolvedSecure =
  resolvedSameSite === 'none' || process.env.COOKIE_SECURE === 'true'
    ? true
    : isProduction
      ? true
      : false;

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: resolvedSecure,
  sameSite: resolvedSameSite,
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30,
  // cookie domain should look like this: .gymleb.com
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};
