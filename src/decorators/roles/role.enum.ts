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
  dashboard = 'dashboard',

  // members permissions
  read_members = 'read:members',
  delete_members = 'delete:members',
  create_members = 'create:members',
  update_members = 'update:members',

  // personal trainers permissions
  read_personal_trainers = 'read:personal-trainers',
  create_personal_trainers = 'create:personal-trainers',
  update_personal_trainers = 'update:personal-trainers',
  delete_personal_trainers = 'delete:personal-trainers',

  // gyms permissions
  read_gyms = 'read:gyms',
  create_gyms = 'create:gyms',
  update_gyms = 'update:gyms',
  delete_gyms = 'delete:gyms',

  // subscriptions permissions
  read_subscriptions = 'read:subscriptions',
  create_subscriptions = 'create:subscriptions',
  update_subscriptions = 'update:subscriptions',
  delete_subscriptions = 'delete:subscriptions',

  // transactions permissions
  read_transactions = 'read:transactions',
  create_transactions = 'create:transactions',
  update_transactions = 'update:transactions',
  delete_transactions = 'delete:transactions',

  // products permissions
  read_products = 'read:products',
  create_products = 'create:products',
  update_products = 'update:products',
  delete_products = 'delete:products',

  // revenue permissions
  read_revenue = 'read:revenue',
  create_revenue = 'create:revenue',
  update_revenue = 'update:revenue',
  delete_revenue = 'delete:revenue',

  // expenses permissions
  read_expenses = 'read:expenses',
  create_expenses = 'create:expenses',
  update_expenses = 'update:expenses',
  delete_expenses = 'delete:expenses',

  // dashboard permissions
  read_dashboard = 'read:dashboard',
  create_dashboard = 'create:dashboard',
  update_dashboard = 'update:dashboard',
  pt_sessions = 'pt-sessions',

  // pt sessions permissions
  create_pt_sessions = 'create:pt-sessions',
  update_pt_sessions = 'update:pt-sessions',
  delete_pt_sessions = 'delete:pt-sessions',
  read_pt_sessions = 'read:pt-sessions',

  // bills permissions
  read_bills = 'read:bills',
  create_bills = 'create:bills',
  update_bills = 'update:bills',
  delete_bills = 'delete:bills',
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

export interface PermissionOption {
  title: string;
  value: string;
}

export interface EntityPermissions {
  entityName: string;
  permissions: PermissionOption[];
}

const permissionTitleMap: Record<string, string> = {
  'read:members': 'Read Members',
  'delete:members': 'Delete Members',
  'create:members': 'Create Members',
  'update:members': 'Update Members',
  'read:personal-trainers': 'Read Personal Trainers',
  'create:personal-trainers': 'Create Personal Trainers',
  'update:personal-trainers': 'Update Personal Trainers',
  'delete:personal-trainers': 'Delete Personal Trainers',
  'read:gyms': 'Read Gyms',
  'create:gyms': 'Create Gyms',
  'update:gyms': 'Update Gyms',
  'delete:gyms': 'Delete Gyms',
  'read:subscriptions': 'Read Subscriptions',
  'create:subscriptions': 'Create Subscriptions',
  'update:subscriptions': 'Update Subscriptions',
  'delete:subscriptions': 'Delete Subscriptions',
  'read:transactions': 'Read Transactions',
  'create:transactions': 'Create Transactions',
  'update:transactions': 'Update Transactions',
  'delete:transactions': 'Delete Transactions',
  'read:products': 'Read Products',
  'create:products': 'Create Products',
  'update:products': 'Update Products',
  'delete:products': 'Delete Products',
  'read:revenue': 'Read Revenue',
  'create:revenue': 'Create Revenue',
  'update:revenue': 'Update Revenue',
  'delete:revenue': 'Delete Revenue',
  'read:expenses': 'Read Expenses',
  'create:expenses': 'Create Expenses',
  'update:expenses': 'Update Expenses',
  'delete:expenses': 'Delete Expenses',
  'read:dashboard': 'Read Dashboard',
  'create:dashboard': 'Create Dashboard',
  'update:dashboard': 'Update Dashboard',
};

const entityPermissionMap: Record<string, string[]> = {
  members: [
    Permissions.read_members,
    Permissions.create_members,
    Permissions.update_members,
    Permissions.delete_members,
  ],
  'personal-trainers': [
    Permissions.read_personal_trainers,
    Permissions.create_personal_trainers,
    Permissions.update_personal_trainers,
    Permissions.delete_personal_trainers,
  ],
  gyms: [
    Permissions.read_gyms,
    Permissions.create_gyms,
    Permissions.update_gyms,
    Permissions.delete_gyms,
  ],
  subscriptions: [
    Permissions.read_subscriptions,
    Permissions.create_subscriptions,
    Permissions.update_subscriptions,
    Permissions.delete_subscriptions,
  ],
  transactions: [
    Permissions.read_transactions,
    Permissions.create_transactions,
    Permissions.update_transactions,
    Permissions.delete_transactions,
  ],
  products: [
    Permissions.read_products,
    Permissions.create_products,
    Permissions.update_products,
    Permissions.delete_products,
  ],
  revenue: [
    Permissions.read_revenue,
    Permissions.create_revenue,
    Permissions.update_revenue,
    Permissions.delete_revenue,
  ],
  expenses: [
    Permissions.read_expenses,
    Permissions.create_expenses,
    Permissions.update_expenses,
    Permissions.delete_expenses,
  ],
  dashboard: [
    Permissions.read_dashboard,
    Permissions.create_dashboard,
    Permissions.update_dashboard,
  ],
};

export const getStructuredPermissions = (): EntityPermissions[] => {
  return Object.entries(entityPermissionMap)
    .filter(([entityName]) => entityName !== 'gym-owner')
    .map(([entityName, permissionValues]) => ({
      entityName,
      permissions: permissionValues.map((value) => ({
        title: permissionTitleMap[value] || value,
        value,
      })),
    }));
};
