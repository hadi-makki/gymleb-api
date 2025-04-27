import { Role } from '../decorators/roles/role.enum';
import { Gym } from '../gym/entities/gym.entity';
import { MainEntity } from '../main-classes/mainEntity';
import Token from '../token/token.entity';
export declare class Manager extends MainEntity {
    username: string;
    password: string;
    email: string;
    tokens: Token[];
    roles: Role[];
    gym: Gym;
    static isPasswordMatch(password: string, hashedPassword: string): Promise<boolean>;
    static hashPassword(password: string): Promise<string>;
}
export declare const ManagerSchema: import("mongoose").Schema<Manager, import("mongoose").Model<Manager, any, any, any, import("mongoose").Document<unknown, any, Manager, any> & Manager & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Manager, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Manager>, {}> & import("mongoose").FlatRecord<Manager> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
