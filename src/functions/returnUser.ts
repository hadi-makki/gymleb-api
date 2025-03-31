import { Manager } from 'src/manager/manager.entity';
import { User } from 'src/user/user.entity';

export function returnUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function returnManager(manager: Manager) {
  return {
    id: manager.id,
    username: manager.username,
    email: manager.email,
    createdAt: manager.createdAt,
    updatedAt: manager.updatedAt,
  };
}
