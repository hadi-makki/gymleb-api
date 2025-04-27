import { Document } from 'mongoose';
export type MainDocument = MainEntity & Document;
export declare class MainEntity extends Document {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isDeactivated: boolean;
}
