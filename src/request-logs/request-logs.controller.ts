import { Controller, Get, Param, Query, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Roles } from 'src/decorators/roles/Role';
import { Permissions } from 'src/decorators/roles/role.enum';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RequestLogsService } from './request-logs.service';
import { UpdateResolveStatusDto } from './dtos/update-resolve-status.dto';

@Controller('request-logs')
@ApiTags('Request Logs')
@UseGuards(ManagerAuthGuard)
@ApiBearerAuth()
export class RequestLogsController {
  constructor(private readonly service: RequestLogsService) {}

  @Get()
  @Roles(Permissions.SuperAdmin)
  async getAll(
    @Paginate() query: PaginateQuery,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(
      {
        ...query,
        filter: {
          ...(query.filter || {}),
        },
      },
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles(Permissions.SuperAdmin)
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/resolve-status')
  @Roles(Permissions.SuperAdmin)
  async updateResolveStatus(
    @Param('id') id: string,
    @Body() updateResolveStatusDto: UpdateResolveStatusDto,
  ) {
    return this.service.updateResolveStatus(
      id,
      updateResolveStatusDto.resolveStatus,
    );
  }
}
