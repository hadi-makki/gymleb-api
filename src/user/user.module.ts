import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { MemberModule } from 'src/member/member.module';
import { TokenModule } from 'src/token/token.module';
import { MediaModule } from 'src/media/media.module';
import { SeedUserMember } from './seed/user-member.seed';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, MemberEntity, GymEntity]),
    TokenModule,
    MediaModule,
    forwardRef(() => MemberModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
