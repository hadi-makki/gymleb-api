import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { ManagerModule } from 'src/manager/manager.module';
import { GymModule } from 'src/gym/gym.module';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    ManagerModule,
    GymModule,
    MongooseModule.forFeature([{ name: Manager.name, schema: ManagerSchema }]),
    AuthenticationModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
