import { ConfigService } from '@nestjs/config';
import { Stream } from 'stream';
export declare class S3Service {
    private readonly configService;
    constructor(configService: ConfigService);
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    private readonly s3BaseUrl;
    uploadFile(file: Express.Multer.File, key: string): Promise<import("@aws-sdk/client-s3").PutObjectCommandOutput>;
    deleteFile(key: string): Promise<import("@aws-sdk/client-s3").DeleteObjectCommandOutput>;
    getFile(key: string): Promise<Stream>;
    getS3Url(key: string): Promise<string>;
}
