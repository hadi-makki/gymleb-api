import { getNavItems } from 'src/utils/navigations copy';
import { Manager } from '../manager/manager.model';
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
  const managerObject = manager.toObject();
  if (managerObject.password) {
    delete managerObject.password;
  }
  if (!managerObject.id) {
    managerObject.id = managerObject._id.toString();
  }
  return {
    ...managerObject,
    navItems: getNavItems(manager.roles),
  };
}
