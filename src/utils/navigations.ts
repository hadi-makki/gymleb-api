import { Permissions } from 'src/decorators/roles/role.enum';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export type NavItem = {
  title: string;
  url: string;
  icon: string;
  isActive: boolean;
  shortcut?: string[];
  items: NavItem[];
  roles: Permissions[];
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  // Core Dashboard & Overview
  {
    title: 'Dashboard',
    url: '/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    roles: [Permissions.GymOwner],
  },
  {
    title: 'My Gym',
    url: '/my-gym',
    icon: 'building',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.gyms],
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: 'calendar',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner],
  },

  // Member Management
  {
    title: 'All Members',
    url: '/members',
    icon: 'users',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.members],
  },
  {
    title: 'Expired Memberships',
    url: '/members/expired',
    icon: 'user-x',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.members],
  },

  // Staff & Training
  {
    title: 'Staff',
    url: '/staff',
    icon: 'user-check',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner],
  },
  {
    title: 'Personal Trainers',
    url: '/personal-trainers',
    icon: 'dumbbell',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner],
  },
  {
    title: 'PT Sessions',
    url: '/pt-sessions',
    icon: 'clock',
    isActive: false,
    items: [],
    roles: [Permissions.personalTrainers],
  },

  // Business & Finance
  {
    title: 'Products',
    url: '/products',
    icon: 'package',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.products],
  },
  {
    title: 'Revenue',
    url: '/revenue',
    icon: 'trending-up',
    isActive: false,
    items: [],
    roles: [
      Permissions.GymOwner,
      Permissions.revenue,
      Permissions.personalTrainers,
    ],
  },
  {
    title: 'Expenses',
    url: '/expenses',
    icon: 'trending-down',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.expenses],
  },
  {
    title: 'Transactions',
    url: '/transactions',
    icon: 'receipt',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.transactions],
  },

  // Subscriptions
  // Admin Only (SuperAdmin)
  {
    title: 'Super Admin Dashboard',
    url: '/super-admin/overview',
    icon: 'building-2',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Available Subscriptions',
    url: '/subscriptions/available',
    icon: 'credit-card',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.subscriptions],
  },

  // Transactions
  {
    title: 'API Logs',
    url: '/super-admin/api-logs',
    icon: 'receipt',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Super Admin Transactions',
    url: '/super-admin/transactions',
    icon: 'receipt',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },

  {
    title: 'Owners Management',
    url: '/super-admin/owners-management',
    icon: 'building-2',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Owner Subscriptions',
    url: '/super-admin/subscriptions/owner',
    icon: 'crown',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'All Twilio Messages',
    url: '/super-admin/twilio-messages',
    icon: 'mail',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Inbound Messages',
    url: '/super-admin/inbound-messages',
    icon: 'mail',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
];

export const getNavItems = (permissions: Permissions[]) => {
  return navItems.filter((item) =>
    item.roles?.some((role) => permissions.includes(role)),
  );
};

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}
