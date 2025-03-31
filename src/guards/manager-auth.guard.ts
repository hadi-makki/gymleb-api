import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manager } from 'src/manager/manager.entity';
import { TokenService } from 'src/token/token.service';
import { FastifyRequest } from 'fastify';
@Injectable()
export class ManagerAuthGuard implements CanActivate {
  constructor(
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('this is the manager auth guard');
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user: Manager }>();

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
    );

    const userId = validatedData?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.managerRepository.findById(userId);
    console.log(user);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = user;

    return true;
  }
}
