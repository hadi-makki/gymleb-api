import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/request/login.dto';
import { RegisterDto } from './dtos/request/register.dto';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '../error/api-responses.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/users.decorator';
import { User as UserEntity } from '../user/user.entity';
import { UserCreatedDto } from './dtos/response/user-created.dto';
import { RefreshTokenOutDto } from './dtos/out/refresh-token-out.dto';
import { RefreshDto } from './dtos/refresh-token.dto';
import { cookieOptions } from '../utils/constants';
import { Request, Response } from 'express';
@Controller('auth')
@ApiTags('auth')
@ApiBadRequestResponse()
@ApiInternalServerErrorResponse()
@ApiNotFoundResponse()
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @Post('register')
  @ApiBody({
    type: RegisterDto,
  })
  @ApiCreatedResponse({
    description: 'User logged in',
    type: UserCreatedDto,
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.AuthService.register(registerDto);
  }

  @Post('login')
  // @ApiBody({
  //   type: LoginDto,
  // })
  @ApiCreatedResponse({
    description: 'User logged in',
    type: UserCreatedDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async login(@Body() loginDto) {
    return await this.AuthService.login(loginDto);
  }

  @Get('test')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async test(@User() user: UserEntity) {
    return this.AuthService.test();
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
    return refreshToken;
  }

  @Get('test2')
  async test2() {
    return this.AuthService.test();
  }
}
