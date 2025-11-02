import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AppUpdateService } from './app-update.service';
import { UploadAppUpdateDto } from './dto/upload-app-update.dto';
import { Platform } from './entities/app-version.entity';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';

@ApiTags('App Updates')
@Controller('app-update')
export class AppUpdateController {
  constructor(private readonly appUpdateService: AppUpdateService) {}

  @Post('upload')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAppUpdateDto })
  @ApiOperation({ summary: 'Upload new app version (Super Admin only)' })
  async uploadVersion(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /(exe|appimage|deb)$/,
          }),
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }), // 500MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('releaseNotes') releaseNotes?: string,
  ) {
    return await this.appUpdateService.uploadVersion(file, releaseNotes);
  }

  @Get('check/:platform/:currentVersion')
  @ApiOperation({
    summary: 'Check for updates (public endpoint for Electron app)',
  })
  async checkForUpdate(
    @Param('platform') platform: Platform,
    @Param('currentVersion') currentVersion: string,
  ) {
    return await this.appUpdateService.checkForUpdate(platform, currentVersion);
  }

  @Get('latest/:platform')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiOperation({ summary: 'Get latest version metadata (Super Admin only)' })
  async getLatestVersion(@Param('platform') platform: Platform) {
    return await this.appUpdateService.getLatestVersion(platform);
  }

  @Get('versions/:platform')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiOperation({
    summary: 'List all versions for platform (Super Admin only)',
  })
  async getAllVersions(@Param('platform') platform: Platform) {
    return await this.appUpdateService.getAllVersions(platform);
  }

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiOperation({ summary: 'Delete version (Super Admin only)' })
  async deleteVersion(@Param('id') id: string) {
    await this.appUpdateService.deleteVersion(id);
    return { message: 'Version deleted successfully' };
  }
}
