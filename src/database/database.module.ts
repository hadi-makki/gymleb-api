import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { isLocalEnv } from '../config/helper/helper-functions';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'ormconfig';

dotenv.config({
  path: `.env`,
});

@Module({
  imports: [
    MongooseModule.forRoot(
      isLocalEnv() ? process.env.LOCAL_MONGODB_URI : process.env.MONGODB_URI,
    ),
    TypeOrmModule.forRoot(dataSourceOptions),
  ],
})
export class DatabaseModule {}
