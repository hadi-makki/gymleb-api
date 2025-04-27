import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { isLocalEnv } from '../config/helper/helper-functions';
import * as dotenv from 'dotenv';
import { ManagerSchema } from '../manager/manager.entity';
import { Manager } from '../manager/manager.entity';

dotenv.config({
  path: `.env`,
});

@Module({
  imports: [
    MongooseModule.forRoot(
      isLocalEnv() ? process.env.LOCAL_MONGODB_URI : process.env.MONGODB_URI,
    ),
  ],
})
export class DatabaseModule {}
