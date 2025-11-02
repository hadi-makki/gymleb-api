import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LicenseService } from './license.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { GenerateLicenseDto } from './dto/generate-license.dto';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { Roles } from 'src/decorators/roles/Role';
import { Permissions } from 'src/decorators/roles/role.enum';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';

@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post('validate')
  // No auth guard - allows unauthenticated users to validate license
  async validateLicense(
    @Body() validateLicenseDto: ValidateLicenseDto,
  ): Promise<any> {
    const result = await this.licenseService.validateLicenseKey(
      validateLicenseDto.licenseKey,
      validateLicenseDto.gymId,
    );

    return result;
  }

  @Post('activate')
  // No auth guard - allows unauthenticated users to activate license
  async activateLicense(@Body() activateLicenseDto: ActivateLicenseDto) {
    // gymId is optional - will use ID from token if not provided
    const gym = await this.licenseService.activateLicenseKey(
      activateLicenseDto.licenseKey,
      activateLicenseDto.gymId, // Optional - token is source of truth
    );

    return {
      success: true,
      gym,
    };
  }

  @Post('generate')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async generateLicense(@Body() generateLicenseDto: GenerateLicenseDto) {
    // Parse expiresAt from ISO string if provided
    const expiresAt = generateLicenseDto.expiresAt
      ? new Date(generateLicenseDto.expiresAt)
      : undefined;

    const licenseKey = await this.licenseService.generateLicenseKey(
      generateLicenseDto.gymId,
      generateLicenseDto.ownerId,
      expiresAt,
    );

    // Also extract the data to show what's in the license
    const licenseData = this.licenseService.extractLicenseData(licenseKey);

    return {
      licenseKey,
      gymId: licenseData?.gymId,
      ownerId: licenseData?.ownerId,
      gym: licenseData?.gym,
      owner: licenseData?.owner
        ? {
            id: licenseData.owner.id,
            username: licenseData.owner.username,
            email: licenseData.owner.email,
            firstName: licenseData.owner.firstName,
            lastName: licenseData.owner.lastName,
            phoneNumber: licenseData.owner.phoneNumber,
          }
        : null,
      issuedAt: licenseData?.issuedAt,
      expiresAt: licenseData?.expiresAt,
    };
  }
}
