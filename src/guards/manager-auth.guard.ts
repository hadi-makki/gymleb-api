import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { TokenService } from '../token/token.service';
import { VALIDATE_MEMBER_RELATED_TO_GYM_KEY } from 'src/decorators/validate-member-related-to-gym.decorator';
import { VALIDATE_GYM_RELATED_TO_OWNER_KEY } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { VALIDATE_PERSONAL_TRAINER_RELATED_TO_GYM_KEY } from 'src/decorators/validate-personal-trainer-related-to-gym.decorator';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { isUUID } from 'class-validator';
import { VALIDATE_GYM_RELATED_TO_MANAGER_OR_MANAGER_IN_GYM_KEY } from 'src/decorators/validate-gym-related-to-manager-or-manager-in-gym.dto';
@Injectable()
export class ManagerAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(ManagerEntity)
    private managerRepository: Repository<ManagerEntity>,
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
    @InjectRepository(GymEntity)
    private gymRepository: Repository<GymEntity>,
    @InjectRepository(MemberEntity)
    private memberRepository: Repository<MemberEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: ManagerEntity }>();
    const response = context.switchToHttp().getResponse();
    const requiredRoles =
      this.reflector.getAllAndOverride<Permissions[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    const validateGymRelatedToOwner = this.reflector.getAllAndOverride<boolean>(
      VALIDATE_GYM_RELATED_TO_OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );
    const validateMemberRelatedToGym =
      this.reflector.getAllAndOverride<boolean>(
        VALIDATE_MEMBER_RELATED_TO_GYM_KEY,
        [context.getHandler(), context.getClass()],
      );
    const validatePersonalTrainerRelatedToGym =
      this.reflector.getAllAndOverride<boolean>(
        VALIDATE_PERSONAL_TRAINER_RELATED_TO_GYM_KEY,
        [context.getHandler(), context.getClass()],
      );

    const validateGymRelatedToManagerOrManagerInGym =
      this.reflector.getAllAndOverride<boolean>(
        VALIDATE_GYM_RELATED_TO_MANAGER_OR_MANAGER_IN_GYM_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredRoles) {
      requiredRoles.push(Permissions.SuperAdmin);
    }

    const validatedData = await this.tokenService.validateJwt(
      request,
      response,
    );

    const userId = validatedData?.sub;

    if (!userId) {
      console.log('Unauthorized');
      throw new UnauthorizedException('Unauthorized');
    }

    const manager = await this.managerRepository.findOne({
      where: { id: userId },
    });

    if (
      (!manager ||
        !requiredRoles.some((role) => manager.permissions.includes(role))) &&
      !requiredRoles.includes(Permissions.Any)
    ) {
      console.log('Unauthorized');
      throw new ForbiddenException('Unauthorized');
    }

    if (validateGymRelatedToOwner) {
      await this.validateGymRelatedToOwner(manager, request);
    }
    if (validateMemberRelatedToGym) {
      await this.validateMemberRelatedToGym(manager, request);
    }
    if (validatePersonalTrainerRelatedToGym) {
      await this.validatePersonalTrainerRelatedToGym(manager, request);
    }
    if (validateGymRelatedToManagerOrManagerInGym) {
      await this.validateGymRelatedToManagerOrManagerInGym(manager, request);
    }
    request.user = manager;

    return true;
  }

  private async validateGymRelatedToOwner(
    manager: ManagerEntity,
    request: Request,
  ) {
    const gymId =
      request.params?.gymId || request.body?.gymId || request.query?.gymId;

    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const gym = await this.gymRepository.findOne({
      where: { id: gymId },
      relations: {
        owner: true,
      },
    });

    if (!gym) {
      throw new ForbiddenException('Gym not found');
    }

    if (gym.owner.id === manager.id) {
      return true;
    }

    const managerInGym = await this.managerRepository.findOne({
      where: { id: manager.id, gyms: { id: gymId } },
    });

    if (!managerInGym) {
      throw new ForbiddenException('Member not found');
    }

    return true;
  }

  async validateGymRelatedToManagerOrManagerInGym(
    manager: ManagerEntity,
    request: Request,
  ) {
    const gymId =
      request.params?.gymId || request.body?.gymId || request.query?.gymId;

    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const gym = await this.gymRepository.findOne({
      where: { id: gymId },
      relations: {
        owner: true,
      },
    });

    if (!gym) {
      throw new ForbiddenException('Gym not found');
    }

    if (gym.owner.id === manager.id) {
      return true;
    }

    const managerInGym = await this.managerRepository.findOne({
      where: { id: manager.id, gyms: { id: gymId } },
    });

    if (!managerInGym) {
      throw new ForbiddenException('Member not found');
    }

    return true;
  }

  private async validateMemberRelatedToGym(
    manager: ManagerEntity,
    request: Request,
  ) {
    const memberId =
      request.params?.memberId ||
      request.body?.memberId ||
      request.query?.memberId;

    const gymId =
      request.params?.gymId || request.body?.gymId || request.query?.gymId;

    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId, gym: { id: gymId } },
      relations: {
        gym: true,
      },
    });
    if (!member) {
      throw new ForbiddenException('Member not found');
    }

    return true;
  }

  private async validatePersonalTrainerRelatedToGym(
    manager: ManagerEntity,
    request: Request,
  ) {
    const personalTrainerId =
      request.params?.personalTrainerId ||
      request.body?.personalTrainerId ||
      request.query?.personalTrainerId;

    const gymId =
      request.params?.gymId || request.body?.gymId || request.query?.gymId;

    console.log('personalTrainerId', personalTrainerId);
    console.log('gymId', gymId);

    if (!isUUID(personalTrainerId)) {
      throw new BadRequestException('Invalid personal trainer id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    // Find the personal trainer
    const personalTrainer = await this.managerRepository.findOne({
      where: { id: personalTrainerId },
      relations: {
        gyms: true,
      },
    });

    if (!personalTrainer) {
      throw new ForbiddenException('Personal trainer not found');
    }

    // Check if the personal trainer has personalTrainers permission
    if (!personalTrainer.permissions?.includes(Permissions.personalTrainers)) {
      throw new ForbiddenException('Personal trainer not found');
    }

    // Check if the personal trainer is associated with the gym
    const isAssociatedWithGym = personalTrainer.gyms?.some(
      (gym) => gym.id === gymId,
    );

    if (!isAssociatedWithGym) {
      throw new ForbiddenException('Personal trainer not found');
    }

    return true;
  }
}
