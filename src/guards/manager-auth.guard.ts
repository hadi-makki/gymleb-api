import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manager } from '../manager/manager.model';
import { TokenService } from '../token/token.service';
import { Permissions } from '../decorators/roles/role.enum';
import { PERMISSIONS_KEY } from '../decorators/roles/Role';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class ManagerAuthGuard implements CanActivate {
  constructor(
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: Manager }>();
    const response = context.switchToHttp().getResponse();
    const requiredRoles =
      this.reflector.getAllAndOverride<Permissions[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (!requiredRoles) {
      requiredRoles.push(Permissions.SuperAdmin);
    }

    const validatedData = await this.tokenService.validateJwt(
      request,
      response,
    );

    const userId = validatedData?.sub;

    console.log('this is the userId', userId);

    if (!userId) {
      console.log('Unauthorized');
      throw new UnauthorizedException('Unauthorized');
    }

    const manager = await this.managerRepository
      .findById(userId)
      .populate('roles');

    if (
      (!manager ||
        !requiredRoles.some((role) => manager.roles.includes(role))) &&
      !requiredRoles.includes(Permissions.Any)
    ) {
      console.log('Unauthorized');
      throw new ForbiddenException('Unauthorized');
    }

    request.user = manager;

    return true;
  }
}
