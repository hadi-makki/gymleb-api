import { MainEntity } from '../../main-classes/mainEntity';
import { Manager } from '../../manager/manager.entity';
import { PersonalTrainer } from '../../personal-trainers/entities/personal-trainer.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
export declare class Gym extends MainEntity {
    name: string;
    address: string;
    phone: string;
    personalTrainers: PersonalTrainer[];
    subscriptions: Subscription[];
    owner: Manager;
    openingDays: {
        day: string;
        openingTime: string;
        closingTime: string;
        isOpen: boolean;
    }[];
}
export declare const GymSchema: import("mongoose").Schema<Gym, import("mongoose").Model<Gym, any, any, any, import("mongoose").Document<unknown, any, Gym, any> & Gym & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Gym, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Gym>, {}> & import("mongoose").FlatRecord<Gym> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
