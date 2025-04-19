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
import { Role } from 'src/decorators/roles/role.enum';
import { ROLES_KEY } from 'src/decorators/roles/Role';
import { Reflector } from '@nestjs/core';
@Injectable()
export class ManagerAuthGuard implements CanActivate {
  constructor(
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('this is the manager auth guard');
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user: Manager }>();
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      requiredRoles.push(Role.SuperAdmin);
    }

    const validatedData = await this.tokenService.validateJwt(
      request,
      context.switchToHttp().getResponse(),
    );

    const userId = validatedData?.sub;

    console.log('userId', userId);

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const manager = await this.managerRepository
      .findById(userId)
      .populate('roles');

    if (
      !manager ||
      !requiredRoles.some((role) => manager.roles.includes(role))
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.user = manager;

    return true;
  }
}
