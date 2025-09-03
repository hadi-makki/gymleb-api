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
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateAttendingDaysDto } from './dto/attending-day.dto';
import { UpdateTrainingPreferencesDto } from './dto/update-training-preferences.dto';
import { SignupMemberDto } from './dto/signup-member.dto';
import { MemberEntity } from './entities/member.entity';
import { MemberService } from './member.service';
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post('create/:gymId')
  @ApiConsumes('multipart/form-data')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
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
  async findAll(
    @User() manager: ManagerEntity,
    @Query('search') search: string,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
    @Param('gymId') gymId: string,
  ) {
    console.log('reachint the controller');
    return await this.memberService.findAll(
      manager,
      search,
      Number(limit),
      Number(page),
      gymId,
    );
  }

  @Get('get-member/:gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async findOne(@Param('id') id: string, @Param('gymId') gymId: string) {
    return await this.memberService.findOne(id, gymId);
  }

  @Patch(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.update(id, updateMemberDto, gymId);
  }

  @Post(':gymId/:id/delete')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async remove(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
    @Body() deleteMemberDto: DeleteMemberDto,
  ) {
    return await this.memberService.remove(
      id,
      gymId,
      deleteMemberDto.deleteTransactions || false,
    );
  }

  @Post(':gymId/:id/renew')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async renewSubscription(
    @Param('id') id: string,
    @Body() renewSubscriptionDto: RenewSubscriptionDto,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.renewSubscription(
      id,
      renewSubscriptionDto.subscriptionId,
      gymId,
      renewSubscriptionDto.giveFullDay,
      renewSubscriptionDto.willPayLater,
    );
  }

  @Get('expired/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
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

  @Post(':gymId/:id/invalidate')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async invalidateMemberSubscription(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.invalidateMemberSubscription(id, gymId);
  }

  @Post('fix-usernames-and-passcodes')
  async fixMemberUsernamesAndPasscodes() {
    return await this.memberService.fixMemberUsernamesAndPasscodes();
  }

  @Post('update-profile-image/:gymId/:id')
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
  async updateProfileImage(
    @User() manager: ManagerEntity,
    @Param('id') id: string,
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
      id,
      file,
      manager,
      gymId,
    );
  }

  @Post('fix-gym-phone-numbers')
  async fixGymPhoneNumbers() {
    return await this.memberService.fixGymPhoneNumbers();
  }

  @Post(':gymId/:id/reset-password')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async resetMemberPassword(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.resetMemberPassword(id, gymId);
  }

  @Post('send-welcome-messages/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  async sendWelcomeMessagesToAllMembers(@Param('gymId') gymId: string) {
    return await this.memberService.sendWelcomeMessageToAllMembers(gymId);
  }

  @Post('bulk-delete/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
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
  async bulkNotifyMembers(
    @Param('gymId') gymId: string,
    @Body() body: { memberIds: string[] },
  ) {
    return await this.memberService.bulkNotifyMembers(body.memberIds, gymId);
  }

  @Get('/get/members-with-expiring-subscriptions')
  async getMembersWithExpiringSubscriptions() {
    return await this.memberService.getMembersWithExpiringSubscriptions({
      days: 3,
    });
  }

  @Get('notify/members-with-expiring-subscriptions')
  async notifyMembersWithExpiringSubscriptions() {
    return await this.memberService.notifyMembersWithExpiringSubscriptions();
  }

  // Attending Days Endpoints
  @Get(':gymId/:id/attending-days')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Get member attending days',
    description: 'Get the attending days and times for a specific member',
  })
  async getMemberAttendingDays(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.memberService.getMemberAttendingDays(id, gymId);
  }

  @Patch(':gymId/:id/attending-days')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Update member attending days',
    description: 'Update the attending days and times for a specific member',
  })
  async updateMemberAttendingDays(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
    @Body() updateAttendingDaysDto: UpdateAttendingDaysDto,
  ) {
    return await this.memberService.updateMemberAttendingDays(
      id,
      gymId,
      updateAttendingDaysDto,
    );
  }

  @Patch(':gymId/:id/training-preferences')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Update member training preferences',
    description:
      'Update the training level, goals, and preferences for a specific member',
  })
  async updateMemberTrainingPreferences(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
    @Body() updateTrainingPreferencesDto: UpdateTrainingPreferencesDto,
  ) {
    return await this.memberService.updateMemberTrainingPreferences(
      id,
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
}
