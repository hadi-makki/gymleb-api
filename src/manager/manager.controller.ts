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

import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { Manager } from './manager.entity';
import { ManagerService } from './manager.service';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { Roles } from 'src/decorators/roles/Role';
import { Role } from 'src/decorators/roles/role.enum';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from 'src/error/api-responses.decorator';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { User } from 'src/decorators/users.decorator';
import { returnManager } from 'src/functions/returnUser';
import { SuccessMessageReturn } from 'src/main-classes/success-message-return';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RefreshDto } from 'src/auth/dtos/refresh-token.dto';
import { cookieOptions } from 'src/utils/constants';
import { RefreshTokenOutDto } from 'src/auth/dtos/out/refresh-token-out.dto';
import { AuthService } from 'src/auth/auth.service';

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
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const loginManager = await this.ManagerService.login(body);
    response.setCookie('token', loginManager.token, {
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
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    response.clearCookie('token');
    return this.ManagerService.logout(user);
  }

  @Get('get/me')
  @UseGuards(ManagerAuthGuard)
  @Roles(Role.Any)
  @ApiBearerAuth()
  @ApiOkResponse({ type: Manager })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async me(@User() user: Manager) {
    return returnManager(user);
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
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const token = req.headers.token as string;
    const refreshToken = await this.AuthService.refreshToken(token, deviceId);
    res.setCookie('token', refreshToken.token, cookieOptions);
    return refreshToken;
  }

  @Get('clear-cookies')
  clearCookies(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '*',
    });

    return { message: 'Cookies cleared' };
  }
}
