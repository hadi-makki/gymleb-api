import { Injectable } from '@nestjs/common';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Stream } from 'stream';

@Injectable()
export class S3Service {
  constructor(private readonly configService: ConfigService) {}

  private readonly s3Client = new S3Client({
    region: this.configService.get<string>('S3_REGION'),
    credentials: {
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    },
  });

  private readonly bucketName = this.configService.get<string>('S3_BUCKET');
  private readonly region = this.configService.get<string>('S3_REGION');
  private readonly s3BaseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

  async uploadFile(file: Express.Multer.File, key: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: Buffer.from(file.buffer),
    });

    return this.s3Client.send(command);
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return this.s3Client.send(command);
  }

  async getFile(key: string): Promise<Stream> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const unit8Array = await (
      await this.s3Client.send(command)
    ).Body.transformToByteArray();

    const stream = new Stream.PassThrough();
    stream.end(Buffer.from(unit8Array));

    return stream;
  }

  async getS3Url(key: string): Promise<string> {
    return `${this.s3BaseUrl}/${key}`;
  }
}
