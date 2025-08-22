export enum Permissions {
  Any = 'any',
  SuperAdmin = 'super-admin',
  members = 'members',
  personalTrainers = 'personal-trainers',
  gyms = 'gyms',
  GymOwner = 'gym-owner',
  subscriptions = 'subscriptions',
  transactions = 'transactions',
  products = 'products',
  revenue = 'revenue',
  expenses = 'expenses',
}

export enum UsableEnums {
  members = 'members',
  personalTrainers = 'personal-trainers',
  gyms = 'gyms',
  GymOwner = 'gym-owner',
  subscriptions = 'subscriptions',
  transactions = 'transactions',
  products = 'products',
  revenue = 'revenue',
  expenses = 'expenses',
}

export const returnAllRoles = () => {
  return Object.values(UsableEnums);
};
