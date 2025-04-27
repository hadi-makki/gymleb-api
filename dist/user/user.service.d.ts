import { Model } from 'mongoose';
import { RegisterDto } from '../auth/dtos/request/register.dto';
import { User } from './user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Model<User>);
    hashPassword(password: string): Promise<string>;
    getUserByEmail(email: string): Promise<User>;
    createUser(data: RegisterDto): Promise<import("mongoose").Document<unknown, {}, User, {}> & User & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    checkUserExists(id: string): Promise<{
        _id: unknown;
    }>;
    getUserById(id: string): Promise<import("mongoose").Document<unknown, {}, User, {}> & User & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    test(): Promise<string>;
}
