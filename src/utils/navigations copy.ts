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
  {
    title: 'Dashboard',
    url: '/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    roles: [Permissions.SuperAdmin, Permissions.GymOwner],
  },
  {
    title: 'My Gym',
    url: '/my-gym',
    icon: 'logo',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.gyms],
  },
  {
    title: 'All Members',
    url: '/members',
    icon: 'user',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.members],
  },
  {
    title: 'Expired Memberships',
    url: '/members/expired',
    icon: 'user',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.members],
  },
  {
    title: 'Personal Trainers',
    url: '/personal-trainers',
    icon: 'user',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner],
  },
  {
    title: 'PT Sessions',
    url: '/pt-sessions',
    icon: 'user',
    isActive: false,
    items: [],
    roles: [Permissions.personalTrainers],
  },
  {
    title: 'Staff',
    url: '/staff',
    icon: 'user',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner],
  },
  {
    title: 'Available Subscriptions',
    url: '/subscriptions/available',
    icon: 'cards',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.subscriptions],
  },
  {
    title: 'Products',
    url: '/products',
    icon: 'product',
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
    roles: [Permissions.GymOwner, Permissions.revenue],
  },
  {
    title: 'Expenses',
    url: '/expenses',
    icon: 'cards',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner, Permissions.expenses],
  },
  {
    title: 'Transactions',
    url: '/transactions',
    icon: 'billing',
    isActive: false,
    items: [],
    roles: [
      Permissions.SuperAdmin,
      Permissions.GymOwner,
      Permissions.transactions,
    ],
  },
  {
    title: 'Gyms Management',
    url: '/gyms-management',
    icon: 'user',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Owner Subscriptions',
    url: '/subscriptions/owner',
    icon: 'cards',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Inbound Messages',
    url: '/inbound-messages',
    icon: 'cards',
    isActive: false,
    items: [],
    roles: [Permissions.SuperAdmin],
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: 'calendar',
    isActive: false,
    items: [],
    roles: [Permissions.GymOwner],
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

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM',
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL',
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN',
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK',
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD',
  },
];
