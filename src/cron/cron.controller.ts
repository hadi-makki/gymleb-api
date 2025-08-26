import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { CronService } from './cron.service';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';

@Controller('cron')
@UseGuards(ManagerAuthGuard)
@Roles(Permissions.SuperAdmin)
export class CronController {
  constructor(private readonly cronService: CronService) {}
}
