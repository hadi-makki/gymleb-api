import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../auth/auth.service';
import { RefreshTokenOutDto } from '../auth/dtos/out/refresh-token-out.dto';
import { RefreshDto } from '../auth/dtos/refresh-token.dto';
import { GetDeviceId } from '../decorators/get-device-id.decorator';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '../error/api-responses.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { GymService } from '../gym/gym.service';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { TransactionService } from '../transactions/subscription-instance.service';
import { CookieNames, cookieOptions } from '../utils/constants';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { ManagerService } from './manager.service';
import { ManagerEntity } from './manager.entity';
import { SubscriptionInstanceEntity } from 'src/transactions/subscription-instance.entity';
@Controller('manager')
@ApiTags('Manager')
@ApiInternalServerErrorResponse()
export class ManagerController {
  constructor(
    private readonly ManagerService: ManagerService,
    private readonly AuthService: AuthService,
    private readonly TransactionService: TransactionService,
    private readonly GymService: GymService,
  ) {}

  @Post('/create/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiCreatedResponse({
    description: 'Manager created successfully',
    type: ManagerCreatedDto,
  })
  @Roles()
  createManager(
    @Body() body: CreateManagerDto,
    @GetDeviceId() deviceId: string,
    @Param('gymId') gymId: string,
  ) {
    return this.ManagerService.createManager(body, deviceId, gymId);
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: ManagerEntity })
  @ApiNotFoundResponse('Manager not found')
  findOne(@Param('id') id: string) {
    return this.ManagerService.findOne(id);
  }

  @Post('login')
  @ApiBadRequestResponse()
  @ApiCreatedResponse({
    description: 'Manager logged in successfully',
    type: ManagerCreatedWithTokenDto,
  })
  @ApiNotFoundResponse('Manager not found')
  async login(
    @Body() body: LoginManagerDto,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    let checkDeviceId = deviceId;
    if (!checkDeviceId) {
      checkDeviceId = uuidv4();
      response.cookie('deviceId', checkDeviceId, cookieOptions);
    }
    const loginManager = await this.ManagerService.login(body, checkDeviceId);
    response.cookie(
      CookieNames.ManagerToken,
      loginManager.token,
      cookieOptions,
    );

    return loginManager;
  }

  @Post('logout')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.Any)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  async logout(
    @User() user: ManagerEntity,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    response.clearCookie(CookieNames.ManagerToken, cookieOptions);
    return this.ManagerService.logout(user, deviceId);
  }

  @Get('get/me')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.Any)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ManagerEntity })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async me(@User() user: ManagerEntity) {
    return this.ManagerService.getMe(user);
  }

  @Patch('update/me')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ManagerEntity })
  updateMe(@User() user: ManagerEntity, @Body() body: UpdateManagerDto) {
    return this.ManagerService.updateManager(user.id, body);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: [ManagerEntity] })
  getAll() {
    return this.ManagerService.getAll();
  }
  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles()
  async deleteManager(
    @Param('id') id: string,
    @GetDeviceId() deviceId: string,
  ) {
    return await this.ManagerService.deleteManager(id, deviceId);
  }

  @Patch('/update/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Manager not found')
  @ApiOkResponse({ type: ManagerEntity })
  @Roles(Permissions.SuperAdmin)
  async updateManager(@Param('id') id: string, @Body() body: UpdateManagerDto) {
    return await this.ManagerService.updateManager(id, body);
  }

  @Post('refresh')
  @ApiCreatedResponse({
    description: 'Token refreshed successfully',
    type: RefreshTokenOutDto,
  })
  async refresh(
    @Body() { deviceId }: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.headers.token as string;
    const refreshToken = await this.AuthService.refreshToken(token, deviceId);
    res.cookie(CookieNames.ManagerToken, refreshToken.token, cookieOptions);
    return refreshToken;
  }

  @Get('clear-cookies')
  clearCookies(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(CookieNames.ManagerToken, cookieOptions);

    return { message: 'Cookies cleared' };
  }

  @Get('get/transactions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiBearerAuth()
  @ApiOkResponse({ type: [SubscriptionInstanceEntity] })
  async getTransactions(@User() user: ManagerEntity) {
    return await this.TransactionService.findAllSubscriptionInstances(user.id);
  }

  @Get('get/analytics')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Admin analytics', type: Object })
  async getAdminAnalytics(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.ManagerService.getAdminAnalytics(start, end);
  }
}
