import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AuthService } from '../auth/auth.service';
import { RefreshTokenOutDto } from '../auth/dtos/out/refresh-token-out.dto';
import { RefreshDto } from '../auth/dtos/refresh-token.dto';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '../error/api-responses.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { cookieOptions } from '../utils/constants';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { Manager } from './manager.entity';
import { ManagerService } from './manager.service';
@Controller('manager')
@ApiTags('Manager')
@ApiInternalServerErrorResponse()
export class ManagerController {
  constructor(
    private readonly ManagerService: ManagerService,
    private readonly AuthService: AuthService,
  ) {}

  @Post('/create')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiCreatedResponse({
    description: 'Manager created successfully',
    type: ManagerCreatedDto,
  })
  @Roles()
  createManager(@Body() body: CreateManagerDto) {
    return this.ManagerService.createManager(body);
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: Manager })
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
  ) {
    const loginManager = await this.ManagerService.login(body);
    response.cookie('token', loginManager.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return loginManager;
  }

  @Post('logout')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  async logout(
    @User() user: Manager,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('token');
    return this.ManagerService.logout(user);
  }

  @Get('get/me')
  @UseGuards(ManagerAuthGuard)
  @Roles(Role.GymOwner)
  @ApiBearerAuth()
  @ApiOkResponse({ type: Manager })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async me(@User() user: Manager) {
    console.log('user', user);
    return this.ManagerService.getMe(user);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: [Manager] })
  @Roles(Role.ReadPersonalTrainers)
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
  deleteManager(@Param('id') id: string) {
    return this.ManagerService.deleteManager(id);
  }

  @Patch('/update/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Manager not found')
  @ApiOkResponse({ type: Manager })
  @Roles()
  updateManager(@Param('id') id: string, @Body() body: UpdateManagerDto) {
    return this.ManagerService.updateManager(id, body);
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
    res.cookie('token', refreshToken.token, cookieOptions);
    return refreshToken;
  }

  @Get('clear-cookies')
  clearCookies(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '*',
    });

    return { message: 'Cookies cleared' };
  }
}
