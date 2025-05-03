import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { isLocalEnv } from '../config/helper/helper-functions';

dotenv.config({
  path: `.env`,
});

console.log('this is the env', isLocalEnv());

@Module({
  imports: [
    MongooseModule.forRoot(
      isLocalEnv() ? process.env.LOCAL_MONGODB_URI : process.env.MONGODB_URI,
    ),
  ],
})
export class DatabaseModule {}
