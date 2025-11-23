import { getNavItems } from 'src/utils/navigations';
import { ManagerEntity } from 'src/manager/manager.entity';
import { UserEntity } from 'src/user/user.entity';

export function returnUser(user: UserEntity) {
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
  console.log('these are the permissions', manager.permissions);
  return {
    ...managerObject,
    navItems: getNavItems(manager.permissions),
  };
}
