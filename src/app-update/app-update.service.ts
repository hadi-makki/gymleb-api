import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AppVersionEntity, Platform } from './entities/app-version.entity';
import { S3Service } from '../s3/s3.service';
import * as crypto from 'crypto';
import { CheckUpdateResponse } from './dto/check-update.dto';

@Injectable()
export class AppUpdateService {
  constructor(
    @InjectRepository(AppVersionEntity)
    private readonly appVersionRepository: Repository<AppVersionEntity>,
    private readonly s3Service: S3Service,
  ) {}

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1; // Increment patch version
    return parts.join('.');
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private detectPlatform(filename: string): Platform {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'exe') {
      return Platform.WINDOWS;
    } else if (ext === 'appimage' || ext === 'deb') {
      return Platform.LINUX;
    }
    throw new BadRequestException(
      'Invalid file extension. Expected .exe, .appimage, or .deb',
    );
  }

  async uploadVersion(
    file: Express.Multer.File,
    releaseNotes?: string,
  ): Promise<AppVersionEntity> {
    // Detect platform from file extension
    const platform = this.detectPlatform(file.originalname);

    // Get latest version for this platform
    const latestVersion = await this.appVersionRepository.findOne({
      where: { platform },
      order: { createdAt: 'DESC' },
    });

    // Calculate new version
    const newVersion = latestVersion
      ? this.incrementVersion(latestVersion.version)
      : '1.0.0';

    // Calculate checksum
    const checksum = this.calculateChecksum(file.buffer);

    // Upload to S3
    const s3Key = `app-updates/${platform}/${newVersion}/${file.originalname}`;
    await this.s3Service.uploadFile(file, s3Key);
    const fileUrl = await this.s3Service.getS3Url(s3Key);

    // Deactivate previous versions for this platform
    await this.appVersionRepository.update(
      { platform, isActive: true },
      { isActive: false },
    );

    // Create new version record
    const appVersion = this.appVersionRepository.create({
      platform,
      version: newVersion,
      releaseNotes,
      fileUrl,
      s3Key,
      fileSize: file.size,
      checksum,
      isActive: true,
      releasedAt: new Date(),
    });

    return await this.appVersionRepository.save(appVersion);
  }

  async checkForUpdate(
    platform: Platform,
    currentVersion: string,
  ): Promise<CheckUpdateResponse> {
    const latestVersion = await this.appVersionRepository.findOne({
      where: { platform, isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (!latestVersion) {
      return { hasUpdate: false };
    }

    const hasUpdate =
      this.compareVersions(latestVersion.version, currentVersion) > 0;

    if (!hasUpdate) {
      return { hasUpdate: false };
    }

    // Increment download count
    await this.appVersionRepository.increment(
      { id: latestVersion.id },
      'downloadCount',
      1,
    );

    return {
      hasUpdate: true,
      version: latestVersion.version,
      downloadUrl: latestVersion.fileUrl,
      releaseNotes: latestVersion.releaseNotes,
      fileSize: latestVersion.fileSize,
      checksum: latestVersion.checksum,
    };
  }

  async getLatestVersion(platform: Platform): Promise<AppVersionEntity> {
    const latestVersion = await this.appVersionRepository.findOne({
      where: { platform, isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (!latestVersion) {
      throw new NotFoundException(
        `No active version found for platform: ${platform}`,
      );
    }

    return latestVersion;
  }

  async getAllVersions(platform: Platform): Promise<AppVersionEntity[]> {
    return await this.appVersionRepository.find({
      where: { platform },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteVersion(id: string): Promise<void> {
    const version = await this.appVersionRepository.findOne({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(version.s3Key);

    // Delete from database
    await this.appVersionRepository.delete(id);
  }
}
