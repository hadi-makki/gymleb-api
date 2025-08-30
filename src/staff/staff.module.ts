import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { GymModule } from 'src/gym/gym.module';
import { ManagerModule } from 'src/manager/manager.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [ManagerModule, GymModule, AuthenticationModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
