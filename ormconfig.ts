import * as dotenv from 'dotenv';
import { join } from 'path';
import { isLocalEnv } from 'src/config/helper/helper-functions';

import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config({
  path: `.env`,
});

const isLocal = isLocalEnv();

const local = isLocal ? 'LOCAL_' : '';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env[local + 'DB_HOST'],
  port: parseInt(process.env[local + 'DB_PORT'], 10),
  username: process.env[local + 'DB_USER'],
  password: process.env[local + 'DB_PASSWORD'],
  database: process.env[local + 'DB_NAME'],
  entities: [
    join(__dirname, 'dist/src/**', '*.entity.{ts,js}'),
    join(__dirname, 'src/**', '*.entity.{ts,js}'),
  ],
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false, // Use this with caution
      },
  synchronize: true,
  // logging: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
