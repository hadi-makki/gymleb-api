import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnauthorizedException } from 'src/error/unauthorized-error';
import { Manager } from 'src/manager/manager.entity';
import { TokenService } from 'src/token/token.service';
import { User } from 'src/user/user.entity';
import { FastifyRequest } from 'fastify';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name)
    private usersRepository: Model<User>,
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
    private tokenService: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user: User | Manager }>();

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
    );

    const userId = validatedData?.sub;

    console.log('userId', userId);

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.usersRepository.findById(userId);

    if (user) {
      request.user = user;
      return true;
    }

    const manager = await this.managerRepository.findById(userId);

    if (manager) {
      request.user = manager;
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
