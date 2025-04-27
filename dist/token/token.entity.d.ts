import { Document } from 'mongoose';
import { MainEntity } from '../main-classes/mainEntity';
import { Manager } from '../manager/manager.entity';
import { Member } from '../member/entities/member.entity';
import { User } from '../user/user.entity';
export declare enum TokenType {
    Access = "access",
    Refresh = "refresh",
    ResetPassword = "reset-password"
}
declare class Token extends MainEntity {
    accessToken: string;
    refreshToken: string;
    refreshExpirationDate: Date;
    accessExpirationDate: Date;
    deviceId: string;
    user: User;
    member: Member;
    manager: Manager;
}
export declare const TokenSchema: import("mongoose").Schema<Token, import("mongoose").Model<Token, any, any, any, Document<unknown, any, Token, any> & Token & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Token, Document<unknown, {}, import("mongoose").FlatRecord<Token>, {}> & import("mongoose").FlatRecord<Token> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export default Token;
