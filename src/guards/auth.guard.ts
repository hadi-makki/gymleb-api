import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '../error/unauthorized-error';
import { TokenService } from '../token/token.service';
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
      .getRequest<Request & { user: MemberEntity }>();

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
      true,
    );

    console.log('this is the validated data', validatedData);
    console.log('this is the path', request.path);

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
