import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManagerEntity } from 'src/manager/manager.entity';
import { GetDeviceId } from '../decorators/get-device-id.decorator';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { MemberEntity } from './entities/member.entity';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { UpdateTrainingProgramDto } from './dto/update-training-program.dto';
import { MemberTrainingProgramService } from './member-training-program.service';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { ValidateMemberRelatedToGym } from 'src/decorators/validate-member-related-to-gym.decorator';

@ApiTags('Member Training Programs')
@Controller('member-training-program')
export class MemberTrainingProgramController {
  constructor(
    private readonly memberTrainingProgramService: MemberTrainingProgramService,
  ) {}

  @Post(':gymId/:memberId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Create or update training program for a member',
    description:
      'Create a new training program for a specific day or update existing one',
  })
  @ApiResponse({
    status: 201,
    description: 'Training program created/updated successfully',
  })
  async createOrUpdateTrainingProgram(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() createTrainingProgramDto: CreateTrainingProgramDto,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.createOrUpdateTrainingProgram(
      memberId,
      gymId,
      createTrainingProgramDto,
      manager,
    );
  }

  @Get(':gymId/:memberId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Get all training programs for a member',
    description: 'Get all training programs for a specific member',
  })
  @ApiResponse({
    status: 200,
    description: 'Training programs retrieved successfully',
  })
  async getMemberTrainingPrograms(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.getMemberTrainingPrograms(
      memberId,
      gymId,
      manager,
    );
  }

  @Get(':gymId/:memberId/:dayOfWeek')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Get training program for a specific day',
    description:
      'Get training program for a specific member and day of the week',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program retrieved successfully',
  })
  async getTrainingProgramByDay(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.getTrainingProgramByDay(
      memberId,
      gymId,
      dayOfWeek,
      manager,
    );
  }

  @Patch(':gymId/:memberId/:dayOfWeek')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Update training program for a specific day',
    description:
      'Update training program for a specific member and day of the week',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program updated successfully',
  })
  async updateTrainingProgram(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() updateTrainingProgramDto: UpdateTrainingProgramDto,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.updateTrainingProgram(
      memberId,
      gymId,
      dayOfWeek,
      updateTrainingProgramDto,
      manager,
    );
  }

  @Delete(':gymId/:memberId/:dayOfWeek')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Delete training program for a specific day',
    description:
      'Delete training program for a specific member and day of the week',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program deleted successfully',
  })
  async deleteTrainingProgram(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.deleteTrainingProgram(
      memberId,
      gymId,
      dayOfWeek,
      manager,
    );
  }

  // Member endpoints (for members to access their own training programs)
  @Get('me/:gymId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get my training programs',
    description: 'Get all training programs for the authenticated member',
  })
  @ApiResponse({
    status: 200,
    description: 'Training programs retrieved successfully',
  })
  async getMyTrainingPrograms(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberTrainingProgramService.getMemberTrainingPrograms(
      member.id,
      gymId,
      null, // No manager needed for member access
    );
  }

  @Get('me/:gymId/:dayOfWeek')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get my training program for a specific day',
    description:
      'Get training program for a specific day for the authenticated member',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program retrieved successfully',
  })
  async getMyTrainingProgramByDay(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Param('dayOfWeek') dayOfWeek: string,
  ) {
    return await this.memberTrainingProgramService.getTrainingProgramByDay(
      member.id,
      gymId,
      dayOfWeek,
      null, // No manager needed for member access
    );
  }
}
