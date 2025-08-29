import { User } from '../user/user.model';
import { imageTypes } from './constants';

export const returnUser = (user: User) => {
  const { password, ...restUser } = user;
  return restUser;
};

export const validateImage = (
  file: Express.Multer.File,
  required?: boolean,
) => {
  if (!file && required) return false;
  if (!file) return true;
  if (!imageTypes.test(file?.mimetype)) return false;
  return true;
};
