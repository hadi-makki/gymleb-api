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
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: '/',
  sameSite: 'none',
  secure: true,
};

export const imageTypes =
  /^image\/(jpeg|png|gif|bmp|webp|jpg|heic|heif|avif|tiff|svg|ico)$/;

export enum CookieNames {
  MemberToken = 'memberToken_v1',
  ManagerToken = 'token_v1',
  UserToken = 'user_token_v2',
  DeviceId = 'deviceId_v1',
}
