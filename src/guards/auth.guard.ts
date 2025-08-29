import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnauthorizedException } from '../error/unauthorized-error';
import { Manager } from '../manager/manager.model';
import { TokenService } from '../token/token.service';
import { User } from '../user/user.model';
import { Member } from '../member/entities/member.model';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(MemberEntity)
    private memberRepository: Repository<MemberEntity>,
    @InjectRepository(ManagerEntity)
    private managerRepository: Repository<ManagerEntity>,
    private tokenService: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User | Manager | Member | MemberEntity }>();

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
      true,
    );

    const userId = validatedData?.sub;

    if (!userId) {
      // await this.tokenService.invalidateToken(request);
      throw new UnauthorizedException('Unauthorized');
    }

    const member = await this.memberRepository.findOne({
      where: { id: userId },
    });

    if (member) {
      request.user = member;
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
