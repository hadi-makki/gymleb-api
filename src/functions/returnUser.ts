import { Manager } from '../manager/manager.entity';
import { User } from '../user/user.entity';

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
    gym: manager.gym,
    roles: manager.roles,
  };
}
