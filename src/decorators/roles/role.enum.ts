export enum Role {
  Any = 'any',
  SuperAdmin = 'super-admin',
  ReadUsers = 'read:users',
  WriteUsers = 'write:users',
  ReadPersonalTrainers = 'read:personal-trainers',
  WritePersonalTrainers = 'write:personal-trainers',
}

export const returnAllRoles = () => {
  return Object.values(Role);
};
