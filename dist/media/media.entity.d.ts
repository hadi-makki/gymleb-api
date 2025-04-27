import { Document } from 'mongoose';
import { User } from '../user/user.entity';
export declare class Media extends Document {
    s3Key: string;
    originalName: string;
    fileName: string;
    size: number;
    mimeType: string;
    user: User;
}
export declare const MediaSchema: import("mongoose").Schema<Media, import("mongoose").Model<Media, any, any, any, Document<unknown, any, Media, any> & Media & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Media, Document<unknown, {}, import("mongoose").FlatRecord<Media>, {}> & import("mongoose").FlatRecord<Media> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
