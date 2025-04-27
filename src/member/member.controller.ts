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
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.entity';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { AuthGuard } from '../guards/auth.guard';
import { Member } from './entities/member.entity';
import { LoginMemberDto } from './dto/login-member.dto';
import { Request, Response } from 'express';
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
  ) {
    console.log('body', body);
    const loginMember = await this.memberService.loginMember(body);
    response.cookie('memberToken', loginMember.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });
    return loginMember;
  }

  @Get()
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async findAll(@User() manager: Manager) {
    return await this.memberService.findAll(manager);
  }

  @Get(':id')
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
  async renewSubscription(@Param('id') id: string) {
    return await this.memberService.renewSubscription(id);
  }

  @Get('expired')
  @Roles(Role.GymOwner)
  @UseGuards(ManagerAuthGuard)
  async getExpiredMembers(@User() manager: Manager) {
    return await this.memberService.getExpiredMembers(manager);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@User() member: Member) {
    return await this.memberService.getMe(member);
  }
}
