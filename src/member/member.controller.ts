import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ManagerEntity } from 'src/manager/manager.entity';
import { GetDeviceId } from '../decorators/get-device-id.decorator';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { WebpPipe } from '../pipes/webp.pipe';
import { cookieOptions } from '../utils/constants';
import { validateImage } from '../utils/helprt-functions';
import { CreateMemberDto } from './dto/create-member.dto';
import { DeleteMemberDto } from './dto/delete-member.dto';
import { LoginMemberDto } from './dto/login-member.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';
import { AddSubscriptionToMemberDto } from './dto/add-subscription-to-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateAttendingDaysDto } from './dto/attending-day.dto';
import { UpdateTrainingPreferencesDto } from './dto/update-training-preferences.dto';
import { SignupMemberDto } from './dto/signup-member.dto';
import { UpdateHealthInformationDto } from './dto/update-health-information.dto';
import { ExtendMembershipDurationDto } from './dto/extend-membership-duration.dto';
import { UpdateProgramLinkDto } from './dto/update-program-link.dto';
import { MemberEntity } from './entities/member.entity';
import { MemberService } from './member.service';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { ValidateMemberRelatedToGym } from 'src/decorators/validate-member-related-to-gym.decorator';
import { ValidateGymRelatedToManagerOrManagerInGym } from 'src/decorators/validate-gym-related-to-manager-or-manager-in-gym.dto';
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post('create/:gymId')
  @ApiConsumes('multipart/form-data')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createMemberDto: CreateMemberDto,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: false,
      }),
      new WebpPipe(),
    )
    file?: Express.Multer.File,
  ) {
    if (file && !validateImage(file)) {
      throw new BadRequestException('File must be an image');
    }
    return await this.memberService.create(
      createMemberDto,
      manager,
      gymId,
      file,
    );
  }

  @Post('login')
  async login(
    @Body() body: LoginMemberDto,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    const loginMember = await this.memberService.loginMember(
      body,
      deviceId,
      response,
    );
    return loginMember;
  }

  @Post('signup')
  async signup(
    @Body() body: SignupMemberDto,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    const signupMember = await this.memberService.signupMember(
      body,
      deviceId,
      response,
    );
    return signupMember;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @User() member: MemberEntity,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    response.clearCookie('memberToken', cookieOptions);
    this.memberService.logout(member, deviceId);
    return { message: 'Logged out successfully' };
  }

  @Get('gym/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToManagerOrManagerInGym()
  async findAll(
    @User() manager: ManagerEntity,
    @Query('search') search: string,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
    @Param('gymId') gymId: string,
    @Query('expiringInDays') expiringInDays?: string,
  ) {
    console.log('reachint the controller');
    return await this.memberService.findAll(
      manager,
      search,
      Number(limit),
      Number(page),
      gymId,
      expiringInDays ? Number(expiringInDays) : undefined,
    );
  }

  @Get('get-member/:gymId/:memberId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async findOne(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.findOne(memberId, gymId);
  }

  @Patch(':gymId/:memberId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async update(
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.update(memberId, updateMemberDto, gymId);
  }

  @Post(':gymId/:memberId/delete')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async remove(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() deleteMemberDto: DeleteMemberDto,
  ) {
    return await this.memberService.remove(
      memberId,
      gymId,
      deleteMemberDto.deleteTransactions || false,
    );
  }

  @Post(':gymId/:memberId/renew')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async renewSubscription(
    @Param('memberId') memberId: string,
    @Body() renewSubscriptionDto: RenewSubscriptionDto,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.renewSubscription(
      memberId,
      renewSubscriptionDto.subscriptionId,
      gymId,
      renewSubscriptionDto.giveFullDay,
      renewSubscriptionDto.willPayLater,
      renewSubscriptionDto.startDate,
      renewSubscriptionDto.endDate,
      renewSubscriptionDto.paidAmount,
    );
  }

  @Post(':gymId/:memberId/add-subscription')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({ summary: 'Add a subscription to a member' })
  @ApiCreatedResponse({
    description: 'Subscription added to member successfully',
  })
  @ApiNotFoundResponse({
    description: 'Member, gym, or subscription not found',
  })
  async addSubscriptionToMember(
    @Param('memberId') memberId: string,
    @Body() addSubscriptionDto: AddSubscriptionToMemberDto,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.addSubscriptionToMember(
      memberId,
      addSubscriptionDto.subscriptionId,
      gymId,
      addSubscriptionDto.giveFullDay,
      addSubscriptionDto.willPayLater,
      addSubscriptionDto.startDate,
      addSubscriptionDto.endDate,
      addSubscriptionDto.paidAmount,
    );
  }

  @Get('expired/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  async getExpiredMembers(
    @User() manager: ManagerEntity,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
    @Query('search') search: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.getExpiredMembers(
      manager,
      Number(limit),
      Number(page),
      search,
      gymId,
    );
  }

  @Get('me/:id')
  async getMe(@Param('id') id: string) {
    return await this.memberService.getMe(id);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyProfile(@User() member: MemberEntity) {
    return await this.memberService.getMe(member.id);
  }

  @Get('pt-sessions/:gymId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get my personal trainer sessions for a gym' })
  async getMyPtSessions(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.getMyPtSessions(member, gymId);
  }

  @Get(':id')
  async getMember(@Param('id') id: string) {
    return await this.memberService.getMember(id);
  }

  @Post(':gymId/:memberId/invalidate/:transactionId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Invalidate a specific member subscription transaction',
  })
  @ApiCreatedResponse({ description: 'Subscription invalidated successfully' })
  @ApiNotFoundResponse({ description: 'Member, gym, or transaction not found' })
  async invalidateMemberSubscription(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return await this.memberService.invalidateMemberSubscription(
      memberId,
      gymId,
      transactionId,
    );
  }

  @Post('fix-usernames-and-passcodes')
  async fixMemberUsernamesAndPasscodes() {
    return await this.memberService.fixMemberUsernamesAndPasscodes();
  }

  @Post('update-profile-image/:gymId/:memberId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update profile image',
    description: "Update a member's profile image with image upload",
  })
  @ApiCreatedResponse({
    type: SuccessMessageReturn,
    description: 'Profile image updated successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async updateProfileImage(
    @User() manager: ManagerEntity,
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
        fileIsRequired: false,
      }),
      new WebpPipe(),
    )
    file?: Express.Multer.File,
  ) {
    if (file && !validateImage(file)) {
      throw new BadRequestException('File must be an image');
    }
    return await this.memberService.updateProfileImage(
      memberId,
      file,
      manager,
      gymId,
    );
  }

  @Post('fix-gym-phone-numbers')
  async fixGymPhoneNumbers() {
    return await this.memberService.fixGymPhoneNumbers();
  }

  @Post(':gymId/:memberId/reset-password')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async resetMemberPassword(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.resetMemberPassword(memberId, gymId);
  }

  @Post('send-welcome-messages/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  async sendWelcomeMessagesToAllMembers(@Param('gymId') gymId: string) {
    return await this.memberService.sendWelcomeMessageToAllMembers(gymId);
  }

  @Post('bulk-delete/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  async bulkDeleteMembers(
    @Param('gymId') gymId: string,
    @Body() body: { memberIds: string[]; deleteTransactions?: boolean },
  ) {
    return await this.memberService.bulkDeleteMembers(
      body.memberIds,
      gymId,
      body.deleteTransactions || false,
    );
  }

  @Post('bulk-notify/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  async bulkNotifyMembers(
    @Param('gymId') gymId: string,
    @Body() body: { memberIds: string[] },
  ) {
    return await this.memberService.bulkNotifyMembers(body.memberIds, gymId);
  }

  @Get('/get/members-with-expiring-subscriptions')
  async getMembersWithExpiringSubscriptions() {
    return (
      await this.memberService.getMembersWithExpiringSubscriptions({
        days: 3,
        isNotified: false,
      })
    ).map((m) => {
      return {
        id: m.member.id,
        name: m.member.name,
        endDate: m.expiringSubscription.endDate,
        gymName: m.gym.name,
      };
    });
  }

  @Get('notify/members-with-expiring-subscriptions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async notifyMembersWithExpiringSubscriptions() {
    return await this.memberService.notifyMembersWithExpiringSubscriptions();
  }

  // Attending Days Endpoints
  @Get(':gymId/:memberId/attending-days')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Get member attending days',
    description: 'Get the attending days and times for a specific member',
  })
  async getMemberAttendingDays(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.getMemberAttendingDays(memberId, gymId);
  }

  @Patch(':gymId/:memberId/attending-days')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Update member attending days',
    description: 'Update the attending days and times for a specific member',
  })
  async updateMemberAttendingDays(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() updateAttendingDaysDto: UpdateAttendingDaysDto,
  ) {
    return await this.memberService.updateMemberAttendingDays(
      memberId,
      gymId,
      updateAttendingDaysDto,
    );
  }

  @Patch(':gymId/:memberId/training-preferences')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Update member training preferences',
    description:
      'Update the training level, goals, and preferences for a specific member',
  })
  async updateMemberTrainingPreferences(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() updateTrainingPreferencesDto: UpdateTrainingPreferencesDto,
  ) {
    return await this.memberService.updateMemberTrainingPreferences(
      memberId,
      gymId,
      updateTrainingPreferencesDto,
    );
  }

  @Patch('/training-preferences/update/me')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update my training preferences',
    description: 'Update my own training level, goals, and preferences',
  })
  async updateMyTrainingPreferences(
    @User() member: MemberEntity,
    @Body() updateTrainingPreferencesDto: UpdateTrainingPreferencesDto,
  ) {
    return await this.memberService.updateMemberTrainingPreferences(
      member.id,
      member.gymId,
      updateTrainingPreferencesDto,
    );
  }

  @Get('gym-attendances/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ApiOperation({
    summary: 'Get all member attendances for a gym',
    description: 'Get all member attending days for a specific gym',
  })
  async getGymAttendances(@Param('gymId') gymId: string) {
    return await this.memberService.getGymAttendances(gymId);
  }

  @Patch(':gymId/:memberId/health-information')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Update member health information',
    description:
      'Update the health information and measurements for a specific member',
  })
  async updateMemberHealthInformation(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() updateHealthInformationDto: UpdateHealthInformationDto,
  ) {
    return await this.memberService.updateMemberHealthInformation(
      memberId,
      gymId,
      updateHealthInformationDto,
    );
  }

  @Patch('membership/extend-duration/:gymId/:memberId/:transactionId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async extendMembershipDuration(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() extendMembershipDurationDto: ExtendMembershipDurationDto,
    @Param('transactionId') transactionId: string,
  ) {
    return await this.memberService.extendMembershipDuration(
      memberId,
      gymId,
      extendMembershipDurationDto,
      transactionId,
    );
  }

  @Patch(':gymId/:memberId/program-link')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  @ApiOperation({
    summary: 'Update member program link',
    description: 'Update the program link for a specific member',
  })
  async updateMemberProgramLink(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @Body() updateProgramLinkDto: UpdateProgramLinkDto,
  ) {
    return await this.memberService.updateMemberProgramLink(
      memberId,
      gymId,
      updateProgramLinkDto,
    );
  }

  // Member endpoints (for members to access their own data)
  @Patch('me/:gymId/program-link')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update my program link',
    description: 'Update the program link for the authenticated member',
  })
  async updateMyProgramLink(
    @User() member: MemberEntity,
    @Param('gymId') gymId: string,
    @Body() updateProgramLinkDto: UpdateProgramLinkDto,
  ) {
    return await this.memberService.updateMemberProgramLink(
      member.id,
      gymId,
      updateProgramLinkDto,
    );
  }
}
