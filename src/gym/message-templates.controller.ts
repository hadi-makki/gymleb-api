import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { Roles } from 'src/decorators/roles/Role';
import { Permissions } from 'src/decorators/roles/role.enum';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import {
  MessageTemplateEntity,
  MessageTemplateType,
} from './entities/message-template.entity';
import { MessageTemplatesService } from './message-templates.service';
import { IsString } from 'class-validator';

class UpsertMessageTemplateDto {
  @IsString()
  content: string;
}

@Controller('gym')
@UseGuards(ManagerAuthGuard)
export class MessageTemplatesController {
  constructor(private readonly svc: MessageTemplatesService) {}

  @Get(':gymId/message-templates')
  @ApiOperation({ summary: 'List message templates for a gym' })
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ApiOkResponse({ type: [MessageTemplateEntity] })
  async list(@Param('gymId') gymId: string) {
    return await this.svc.listByGym(gymId);
  }

  @Put(':gymId/message-templates/:type')
  @ApiOperation({ summary: 'Upsert a message template for a gym' })
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ApiOkResponse({ type: MessageTemplateEntity })
  async upsert(
    @Param('gymId') gymId: string,
    @Param('type') type: MessageTemplateType,
    @Body() body: UpsertMessageTemplateDto,
  ) {
    return await this.svc.upsert(gymId, type, body.content || '');
  }
}
