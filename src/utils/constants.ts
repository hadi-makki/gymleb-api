import { CookieOptions } from 'express';
import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env`,
});

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
  domain: cookieDomain,
};

export const imageTypes =
  /^image\/(jpeg|png|gif|bmp|webp|jpg|heic|heif|avif|tiff|svg|ico)$/;

export enum CookieNames {
  MemberToken = 'memberToken',
  ManagerToken = 'token',
}
