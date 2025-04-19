import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { User } from 'src/decorators/users.decorator';
import { Manager } from 'src/manager/manager.entity';
import { Roles } from 'src/decorators/roles/Role';
import { Role } from 'src/decorators/roles/role.enum';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';

@Controller('member')
@Roles(Role.GymOwner)
@UseGuards(ManagerAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  create(@Body() createMemberDto: CreateMemberDto, @User() manager: Manager) {
    return this.memberService.create(createMemberDto, manager);
  }

  @Get()
  findAll() {
    return this.memberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.memberService.update(id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }

  @Post(':id/renew')
  renewSubscription(@Param('id') id: string) {
    return this.memberService.renewSubscription(id);
  }
}
