import { Response } from 'express';
import { Model } from 'mongoose';
import { S3Service } from '../s3/s3.service';
import { UserService } from '../user/user.service';
import { Media } from './media.entity';
export declare class MediaService {
    private readonly mediaRepository;
    private readonly s3Service;
    private readonly usersService;
    constructor(mediaRepository: Model<Media>, s3Service: S3Service, usersService: UserService);
    upload(file: any, userId?: string): Promise<{
        id: any;
    }>;
    delete(id: string): Promise<void>;
    getFileById(id: string): Promise<import("mongoose").Document<unknown, {}, Media, {}> & Media & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getFileStreamById(id: string, res: Response): Promise<import("stream")>;
    uploadUrl(url: string, userId: string): ReturnType<typeof this.upload>;
    urlToMulter(url: string): Promise<Express.Multer.File>;
    getS3Url(id: string, userId?: string | null): Promise<{
        url: string;
    }>;
}
