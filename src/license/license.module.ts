import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { TokenService } from 'src/token/token.service';
import { TokenEntity } from 'src/token/token.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { GymModule } from 'src/gym/gym.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GymEntity, ManagerEntity, TokenEntity]),
    JwtModule.register({}),
    ConfigModule,
    AuthenticationModule,
    GymModule, // Import GymModule to access GymService
  ],
  controllers: [LicenseController],
  providers: [LicenseService, TokenService],
  exports: [LicenseService],
})
export class LicenseModule {}
