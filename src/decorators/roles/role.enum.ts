export enum Role {
  Any = 'any',
  SuperAdmin = 'super-admin',
  ReadUsers = 'read:users',
  WriteUsers = 'write:users',
  ReadPersonalTrainers = 'read:personal-trainers',
  WritePersonalTrainers = 'write:personal-trainers',
  ReadGymOwners = 'read:gym-owners',
  WriteGymOwners = 'write:gym-owners',
  ReadGyms = 'read:gyms',
  WriteGyms = 'write:gyms',
  GymOwner = 'gym-owner',
}

export const returnAllRoles = () => {
  return Object.values(Role);
};
