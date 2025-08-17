import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.entity';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { AuthGuard } from '../guards/auth.guard';
import { Member } from './entities/member.entity';
import { LoginMemberDto } from './dto/login-member.dto';
import { Request, Response } from 'express';
import { cookieOptions } from '../utils/constants';
import { GetDeviceId } from '../decorators/get-device-id.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { WebpPipe } from '../pipes/webp.pipe';
import { validateImage } from '../utils/helprt-functions';
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async create(
    @Body() createMemberDto: CreateMemberDto,
    @User() manager: Manager,
  ) {
    return await this.memberService.create(createMemberDto, manager);
  }

  @Post('login')
  async login(
    @Body() body: LoginMemberDto,
    @Res({ passthrough: true }) response: Response,
    // @GetDeviceId() deviceId: string,
  ) {
    const loginMember = await this.memberService.loginMember(body);
    // response.cookie('memberToken', loginMember.token, cookieOptions);
    return loginMember;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @User() member: Member,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    response.clearCookie('memberToken', cookieOptions);
    this.memberService.logout(member, deviceId);
    return { message: 'Logged out successfully' };
  }

  @Get()
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async findAll(
    @User() manager: Manager,
    @Query('search') search: string,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
  ) {
    return await this.memberService.findAll(
      manager,
      search,
      Number(limit),
      Number(page),
    );
  }

  @Get('get-member/:id')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.memberService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return await this.memberService.update(id, updateMemberDto);
  }

  @Delete(':id')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.memberService.remove(id);
  }

  @Post(':id/renew')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async renewSubscription(
    @Param('id') id: string,
    @Body() renewSubscriptionDto: RenewSubscriptionDto,
  ) {
    return await this.memberService.renewSubscription(
      id,
      renewSubscriptionDto.subscriptionId,
      renewSubscriptionDto.giveFullDay,
    );
  }

  @Get('expired')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async getExpiredMembers(
    @User() manager: Manager,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
    @Query('search') search: string,
  ) {
    return await this.memberService.getExpiredMembers(
      manager,
      Number(limit),
      Number(page),
      search,
    );
  }

  @Get('me/:id')
  async getMe(@Param('id') id: string) {
    return await this.memberService.getMe(id);
  }

  @Get(':id')
  async getMember(@Param('id') id: string) {
    return await this.memberService.getMember(id);
  }

  @Post(':id/invalidate')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async invalidateMemberSubscription(@Param('id') id: string) {
    return await this.memberService.invalidateMemberSubscription(id);
  }

  @Post('fix-usernames-and-passcodes')
  async fixMemberUsernamesAndPasscodes() {
    return await this.memberService.fixMemberUsernamesAndPasscodes();
  }

  @Post('update-profile-image/:id')
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
  @Roles(Role.GymOwner)
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(ManagerAuthGuard)
  async updateProfileImage(
    @User() manager: Manager,
    @Param('id') id: string,
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
    return await this.memberService.updateProfileImage(id, file, manager);
  }

  @Post('fix-gym-phone-numbers')
  async fixGymPhoneNumbers() {
    return await this.memberService.fixGymPhoneNumbers();
  }
}
