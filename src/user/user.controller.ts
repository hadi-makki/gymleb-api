import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { GetDeviceId } from '../decorators/get-device-id.decorator';
import { UserAuthGuard } from '../guards/user-auth.guard';
import { User } from '../decorators/users.decorator';
import { ApiBadRequestResponse } from '../error/api-responses.decorator';
import { validateImage } from '../utils/helprt-functions';
import { WebpPipe } from '../pipes/webp.pipe';
import { CookieNames, cookieOptions } from '../utils/constants';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { UserEntity } from './user.entity';
import { CheckUserPasswordDto } from './dto/check-user-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserNameDto } from './dto/update-user-name.dto';
import { UpdateUserTrainingPreferencesDto } from './dto/update-user-training-preferences.dto';
import { DeactivateUserDto } from './dto/deactivate-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import {
  ReturnUserWithTokenDto,
  ReturnUserMeDto,
  ReturnUserDto,
} from './dto/return-user.dto';
import { SignupUserDto } from './dto/signup-user.dto';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Sign up user with phone and password',
    description:
      'Creates a new user account using phone number, phone ISO code, and password. Does not create members or link to a gym.',
  })
  @ApiCreatedResponse({
    description: 'Signup successful',
    type: ReturnUserWithTokenDto,
  })
  @ApiBadRequestResponse('User already exists')
  async signup(
    @Body() body: SignupUserDto,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    return await this.userService.signupUser(body, deviceId, response);
  }

  @Post('check-password')
  @ApiOperation({
    summary: 'Check if user has password',
    description:
      'Check if any members under the user have passwords. Returns hasPassword status.',
  })
  @ApiCreatedResponse({
    description: 'Password status returned successfully',
    schema: {
      type: 'object',
      properties: {
        hasPassword: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse('User not found')
  async checkPassword(@Body() body: CheckUserPasswordDto) {
    return await this.userService.checkUserPasswordStatus(
      body.phoneNumber,
      body.phoneNumberISOCode,
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user or create password',
    description:
      'Login user with password. If no members have passwords, sets password for all members. If members have passwords, validates against them. If the account is deactivated, it will be automatically reactivated upon successful login.',
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    type: ReturnUserWithTokenDto,
  })
  @ApiBadRequestResponse('Invalid phone number or password')
  async login(
    @Body() body: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    return await this.userService.loginOrCreatePassword(
      body.phoneNumber,
      body.password,
      body.phoneNumberISOCode,
      deviceId,
      response,
    );
  }

  @Get('gyms')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Get all gyms for authenticated user',
    description:
      'Returns all unique gyms that are related to the members under the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'Gyms retrieved successfully',
    type: [GymEntity],
  })
  async getUserGyms(@User() user: UserEntity) {
    return await this.userService.getUserGyms(user.id);
  }

  @Get('me')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Get authenticated user profile',
    description:
      'Returns the authenticated user with all related members and gyms.',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: ReturnUserMeDto,
  })
  async getMe(@User() user: UserEntity) {
    return await this.userService.getMe(user.id);
  }

  @Patch('name')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Update user name',
    description: 'Updates the name of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'User name updated successfully',
    type: ReturnUserDto,
  })
  @ApiBadRequestResponse('Invalid name or user not found')
  async updateName(@User() user: UserEntity, @Body() body: UpdateUserNameDto) {
    return await this.userService.updateName(user.id, body.name);
  }

  @Get('members/:memberId/profile')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Get member profile by ID',
    description:
      'Returns the profile of a member that belongs to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Member profile retrieved successfully',
  })
  @ApiBadRequestResponse('Member not found or does not belong to this user')
  async getMemberProfile(
    @User() user: UserEntity,
    @Param('memberId') memberId: string,
  ) {
    return await this.userService.getMemberProfile(user.id, memberId);
  }

  @Post('me/profile-image')
  @ApiConsumes('multipart/form-data')
  @UseGuards(UserAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Update my profile image',
    description:
      'Update my own profile image with image upload. This will sync the profile image to all members under this user.',
  })
  @ApiCreatedResponse({
    description: 'Profile image updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse('Invalid file or user not found')
  async updateMyProfileImage(
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
        fileIsRequired: false,
      }),
      new WebpPipe(),
    )
    file?: Express.Multer.File,
  ) {
    if (file && !validateImage(file)) {
      throw new BadRequestException('File must be an image');
    }
    return await this.userService.updateProfileImage(user.id, file);
  }

  @Patch('me/training-preferences')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Update user training preferences',
    description:
      'Updates the training preferences of the authenticated user. This will sync the preferences to all members under this user.',
  })
  @ApiOkResponse({
    description: 'Training preferences updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse('Invalid preferences or user not found')
  async updateMyTrainingPreferences(
    @User() user: UserEntity,
    @Body() body: UpdateUserTrainingPreferencesDto,
  ) {
    return await this.userService.updateTrainingPreferences(user.id, body);
  }

  @Patch('mark-app-downloaded')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Mark app as downloaded',
    description:
      'Marks that the authenticated user has downloaded the app. Sets hasDownloadedApp to true and downloadedAt to current timestamp.',
  })
  @ApiOkResponse({
    description: 'App download marked successfully',
    type: ReturnUserDto,
  })
  @ApiBadRequestResponse('User not found')
  async markAppDownloaded(@User() user: UserEntity) {
    return await this.userService.markAppDownloaded(user.id);
  }

  @Post('logout')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the authenticated user and clears their session token.',
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  async logout(
    @User() user: UserEntity,
    @Res({ passthrough: true }) response: Response,
    @GetDeviceId() deviceId: string,
  ) {
    response.clearCookie(CookieNames.UserToken, cookieOptions);
    await this.userService.logout(user, deviceId);
    return { message: 'Logged out successfully' };
  }

  @Post('deactivate')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Deactivate user account',
    description:
      'Deactivates the authenticated user account. Requires password verification. Members remain in the database. The account can be reactivated by logging in again.',
  })
  @ApiOkResponse({
    description: 'Account deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Account deactivated successfully',
        },
      },
    },
  })
  @ApiBadRequestResponse('Invalid password or user not found')
  async deactivate(
    @User() user: UserEntity,
    @Body() body: DeactivateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.userService.deactivateUser(user.id, body.password);
    response.clearCookie(CookieNames.UserToken, cookieOptions);
    return { message: 'Account deactivated successfully' };
  }

  @Post('delete')
  @UseGuards(UserAuthGuard)
  @ApiOperation({
    summary: 'Delete user account',
    description:
      'Permanently deletes the authenticated user account. Requires password verification. Members remain in the database with user reference set to null.',
  })
  @ApiOkResponse({
    description: 'Account deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' },
      },
    },
  })
  @ApiBadRequestResponse('Invalid password or user not found')
  async delete(
    @User() user: UserEntity,
    @Body() body: DeleteUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.userService.deleteUser(user.id, body.password);
    response.clearCookie(CookieNames.UserToken, cookieOptions);
    return { message: 'Account deleted successfully' };
  }
}
