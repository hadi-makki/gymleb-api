import { User } from '../user/user.entity';
import { imageTypes } from './constants';

export const returnUser = (user: User) => {
  const { password, ...restUser } = user;
  return restUser;
};

export const validateImage = (file: Express.Multer.File) => {
  if (!file) return false;
  if (!imageTypes.test(file.mimetype)) return false;
  return true;
};
