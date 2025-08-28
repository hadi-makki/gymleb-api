import * as dotenv from 'dotenv';
import { join } from 'path';
import { isLocalEnv } from 'src/config/helper/helper-functions';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { TokenEntity } from 'src/token/token.entity';

import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config({
  path: `.env`,
});

const isLocal = isLocalEnv();

const local = isLocal ? 'LOCAL_' : '';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env[local + 'DB_HOST'],
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env[local + 'DB_USER'],
  password: process.env[local + 'DB_PASSWORD'],
  database: process.env[local + 'DB_NAME'],
  entities: [
    ManagerEntity,
    GymEntity,
    TokenEntity,
    OwnerSubscriptionEntity,
    OwnerSubscriptionTypeEntity,
  ],
  migrations: [join(__dirname, 'src/database', 'migrations', '*.{ts,js}')],
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false, // Use this with caution
      },
  synchronize: true,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
