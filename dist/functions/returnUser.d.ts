import { Manager } from '../manager/manager.entity';
import { User } from '../user/user.entity';
export declare function returnUser(user: User): {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function returnManager(manager: Manager): {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    gym: import("../gym/entities/gym.entity").Gym;
};
