import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { TokenModule } from 'src/token/token.module';
import { SeedUserMember } from './seed/user-member.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, MemberEntity, GymEntity]),
    TokenModule,
  ],
  controllers: [UserController],
  providers: [UserService, SeedUserMember],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
