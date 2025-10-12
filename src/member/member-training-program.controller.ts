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
import { RenameTrainingProgramKeyDto } from './dto/rename-training-program-key.dto';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { ValidateMemberRelatedToGym } from 'src/decorators/validate-member-related-to-gym.decorator';
import { MemberTrainingProgramSeed } from './seed/member-training-program.seed';

@ApiTags('Member Training Programs')
@Controller('member-training-program')
export class MemberTrainingProgramController {
  constructor(
    private readonly memberTrainingProgramService: MemberTrainingProgramService,
    private readonly memberTrainingProgramSeed: MemberTrainingProgramSeed,
  ) {}

  @Post('/manager/:gymId/:memberId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Create or update training program for a member',
    description:
      'Create a new named training program or update an existing one',
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

  @Get('/manager/:gymId/:memberId')
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

  @Get('/manager/:gymId/:memberId/:programKey')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Get training program by key',
    description: 'Get training program for a specific member and program key',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program retrieved successfully',
  })
  async getTrainingProgramByDay(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.getTrainingProgramByKey(
      memberId,
      gymId,
      programKey,
      manager,
    );
  }

  @Patch('/manager/:gymId/:memberId/:programKey')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Update training program by key',
    description:
      'Update training program for a specific member and program key',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program updated successfully',
  })
  async updateTrainingProgram(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
    @Body() updateTrainingProgramDto: UpdateTrainingProgramDto,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.updateTrainingProgram(
      memberId,
      gymId,
      programKey,
      updateTrainingProgramDto,
      manager,
    );
  }

  @Delete('/manager/:gymId/:memberId/:programKey')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Delete training program by key',
    description:
      'Delete training program for a specific member and program key',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program deleted successfully',
  })
  async deleteTrainingProgram(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.deleteTrainingProgram(
      memberId,
      gymId,
      programKey,
      manager,
    );
  }

  @Patch('/manager/:gymId/:memberId/:programKey/rename')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({ summary: 'Rename training program key for member' })
  async renameTrainingProgramKey(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
    @Body() body: RenameTrainingProgramKeyDto,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.renameTrainingProgramKey(
      memberId,
      gymId,
      programKey,
      body.newProgramKey,
      manager,
    );
  }

  @Patch('/manager/:gymId/:memberId/by-id/:programId/rename')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Rename training program key by program id for member',
  })
  async renameTrainingProgramKeyById(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('programId') programId: string,
    @Body() body: RenameTrainingProgramKeyDto,
    @User() manager: ManagerEntity,
  ) {
    return await this.memberTrainingProgramService.renameTrainingProgramKeyById(
      memberId,
      gymId,
      programId,
      body.newProgramKey,
      manager,
    );
  }

  // Member endpoints (for members to access their own training programs)
  @Get('member/:gymId')
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

  @Get('member/:gymId/:programKey')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get my training program by key',
    description:
      'Get training program for a specific key for the authenticated member',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program retrieved successfully',
  })
  async getMyTrainingProgramByDay(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
  ) {
    return await this.memberTrainingProgramService.getTrainingProgramByKey(
      member.id,
      gymId,
      programKey,
      null, // No manager needed for member access
    );
  }

  @Post('member/:gymId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Create or update my training program',
    description:
      'Create or update training program for the authenticated member',
  })
  @ApiResponse({
    status: 201,
    description: 'Training program created/updated successfully',
  })
  async createOrUpdateMyTrainingProgram(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Body() createTrainingProgramDto: CreateTrainingProgramDto,
  ) {
    return await this.memberTrainingProgramService.createOrUpdateTrainingProgram(
      member.id,
      gymId,
      createTrainingProgramDto,
      null, // No manager needed for member access
    );
  }

  @Patch('member/:gymId/:programKey')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update my training program by key',
    description:
      'Update training program for a specific key for the authenticated member',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program updated successfully',
  })
  async updateMyTrainingProgram(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
    @Body() updateTrainingProgramDto: UpdateTrainingProgramDto,
  ) {
    return await this.memberTrainingProgramService.updateTrainingProgram(
      member.id,
      gymId,
      programKey,
      updateTrainingProgramDto,
      null, // No manager needed for member access
    );
  }

  @Delete('member/:gymId/:programKey')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Delete my training program by key',
    description:
      'Delete training program for a specific key for the authenticated member',
  })
  @ApiResponse({
    status: 200,
    description: 'Training program deleted successfully',
  })
  async deleteMyTrainingProgram(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
  ) {
    return await this.memberTrainingProgramService.deleteTrainingProgram(
      member.id,
      gymId,
      programKey,
      null, // No manager needed for member access
    );
  }

  @Patch('member/:gymId/:programKey/rename')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Rename my training program key' })
  async renameMyTrainingProgramKey(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Param('programKey') programKey: string,
    @Body() body: RenameTrainingProgramKeyDto,
  ) {
    return await this.memberTrainingProgramService.renameTrainingProgramKey(
      member.id,
      gymId,
      programKey,
      body.newProgramKey,
      null,
    );
  }

  @Patch('member/:gymId/by-id/:programId/rename')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Rename my training program key by program id' })
  async renameMyTrainingProgramKeyById(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Param('programId') programId: string,
    @Body() body: RenameTrainingProgramKeyDto,
  ) {
    return await this.memberTrainingProgramService.renameTrainingProgramKeyById(
      member.id,
      gymId,
      programId,
      body.newProgramKey,
      null,
    );
  }

  @Post('/manager/:gymId/:memberId/generate-defaults')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateMemberRelatedToGym()
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Generate default training programs for a member',
    description:
      'Creates default training programs for all missing program keys',
  })
  @ApiResponse({
    status: 201,
    description: 'Default training programs generated successfully',
  })
  async generateDefaultTrainingPrograms(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @User() manager: ManagerEntity,
  ) {
    const programs =
      await this.memberTrainingProgramSeed.generateDefaultTrainingProgramsForMember(
        memberId,
      );
    return {
      message: 'Default training programs generated successfully',
      programs: programs || [],
    };
  }

  @Post('member/:gymId/generate-defaults')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Generate default training programs for myself',
    description:
      'Creates default training programs for all missing program keys',
  })
  @ApiResponse({
    status: 201,
    description: 'Default training programs generated successfully',
  })
  async generateMyDefaultTrainingPrograms(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
  ) {
    const programs =
      await this.memberTrainingProgramSeed.generateDefaultTrainingProgramsForMember(
        member.id,
      );
    return {
      message: 'Default training programs generated successfully',
      programs: programs || [],
    };
  }
}
