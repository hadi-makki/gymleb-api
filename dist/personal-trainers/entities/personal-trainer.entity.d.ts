import { Manager } from '../../manager/manager.entity';
import { User } from '../../user/user.entity';
import { Gym } from '../../gym/entities/gym.entity';
export declare class PersonalTrainer extends Manager {
    users: User[];
    gym: Gym;
}
export declare const PersonalTrainerSchema: import("mongoose").Schema<PersonalTrainer, import("mongoose").Model<PersonalTrainer, any, any, any, import("mongoose").Document<unknown, any, PersonalTrainer, any> & PersonalTrainer & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PersonalTrainer, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PersonalTrainer>, {}> & import("mongoose").FlatRecord<PersonalTrainer> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
