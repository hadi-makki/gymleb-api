import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '../error/unauthorized-error';
import { TokenService } from '../token/token.service';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: UserEntity }>();

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
      false,
      true, // isUser = true
    );

    const userId = validatedData?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      request.user = user;
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
