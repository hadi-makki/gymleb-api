import { UserEntity } from 'src/user/user.entity';
import { imageTypes } from './constants';

export const returnUser = (user: UserEntity) => {
  return user;
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
