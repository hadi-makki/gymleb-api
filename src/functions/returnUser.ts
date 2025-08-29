import { getNavItems } from 'src/utils/navigations copy';
import { Manager } from '../manager/manager.model';
import { User } from '../user/user.model';
import { ManagerEntity } from 'src/manager/manager.entity';

export function returnUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function returnManager(manager: ManagerEntity) {
  const managerObject = manager;
  if (managerObject.password) {
    delete managerObject.password;
  }
  return {
    ...managerObject,
    navItems: getNavItems(manager.permissions),
  };
}
