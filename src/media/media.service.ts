import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { isMongoId, isUUID } from 'class-validator';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../s3/s3.service';
import { UserService } from '../user/user.service';
import { MediaEntity } from './media.entity';
@Injectable()
export class MediaService {
  constructor(
    // private readonly mediaRepository: MediaRepository,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    private readonly s3Service: S3Service,
    private readonly usersService: UserService,
  ) {}

  async upload(file: any, userId: string = null) {
    // const checkUser = await this.usersService.checkUserExists(userId);
    // if (!checkUser) {
    //   throw new NotFoundException('User not found in media service');
    // }
    const bufferLength = file.buffer.length || file.buffer.data.length;
    if (!bufferLength) {
      throw new BadRequestException('File buffer is empty');
    }

    const extension = file.originalname.split('.').pop();
    const key = uuidv4() + '.' + extension;

    const media = this.mediaRepository.create({
      s3Key: key,
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      // userId: userId,
    });
    const savedMedia = await this.mediaRepository.save(media);
    await this.s3Service.uploadFile(file, key);

    return savedMedia;
  }
  async delete(id: string) {
    try {
      // Find the media entity
      const media = await this.mediaRepository.findOne({
        where: {
          ...(isMongoId(id) && { mongoId: id }),
          ...(isUUID(id) && { id }),
        },
      });
      if (!media) {
        throw new NotFoundException('Media not found');
      }

      // Log the media found

      // Delete the file from S3
      await this.s3Service.deleteFile(media.s3Key);

      // Delete the media record from the repository
      await this.mediaRepository.delete(id);

      // Log success
    } catch (err) {
      throw new BadRequestException('error in deleting the message ' + err);
    }
  }

  async getFileById(id: string) {
    const media = await this.mediaRepository.findOne({
      where: { id },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async getFileStreamById(id: string, res: Response) {
    const media = await this.mediaRepository.findOne({
      where: {
        ...(isMongoId(id) && { mongoId: id }),
        ...(isUUID(id) && { id }),
      },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${media.originalName}"`,
    );

    return this.s3Service.getFile(media.s3Key);
  }

  async uploadUrl(url: string, userId: string): ReturnType<typeof this.upload> {
    const multerFile = await this.urlToMulter(url);
    return await this.upload(multerFile, userId);
  }

  async urlToMulter(url: string): Promise<Express.Multer.File> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    return {
      originalname: url,
      mimetype: response.headers['content-type'],
      size: response.data.byteLength,
      buffer: Buffer.from(response.data),
      fieldname: 'file',
      stream: null,
      destination: '',
      filename: '',
      path: '',
      encoding: '',
    };
  }

  async getS3Url(
    id: string,
    userId: string | null = null,
  ): Promise<{ url: string }> {
    const media = await this.mediaRepository.findOne({
      where: { id },
    });

    // if (!media || (userId && media.user.id !== userId)) {
    //   throw new NotFoundException('Media not found');
    // }

    return { url: await this.s3Service.getS3Url(media.s3Key) };
  }
}
