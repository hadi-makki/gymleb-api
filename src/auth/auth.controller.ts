import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UserEntity } from 'src/user/user.entity';
import { User } from '../decorators/users.decorator';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '../error/api-responses.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthService } from './auth.service';
import { RefreshTokenOutDto } from './dtos/out/refresh-token-out.dto';
import { RefreshDto } from './dtos/refresh-token.dto';

@Controller('auth')
@ApiTags('auth')
@ApiBadRequestResponse()
@ApiInternalServerErrorResponse()
@ApiNotFoundResponse()
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

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
