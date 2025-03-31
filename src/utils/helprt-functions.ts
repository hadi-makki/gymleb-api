import { User } from 'src/user/user.entity';

export const returnUser = (user: User) => {
  const { password, ...restUser } = user;
  return restUser;
};
