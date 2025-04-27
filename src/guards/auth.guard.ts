import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnauthorizedException } from '../error/unauthorized-error';
import { Manager } from '../manager/manager.entity';
import { TokenService } from '../token/token.service';
import { User } from '../user/user.entity';
import { FastifyRequest } from 'fastify';
import { Member } from '../member/entities/member.entity';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel(Member.name)
    private memberRepository: Model<Member>,
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
    private tokenService: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user: User | Manager | Member }>();

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
      true,
    );

    const userId = validatedData?.sub;

    console.log('userId', userId);

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const member = await this.memberRepository.findById(userId);
    console.log('member', member);

    if (member) {
      request.user = member;
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
