import { Gym } from '../../gym/entities/gym.entity';
import { Manager } from '../../manager/manager.entity';
export declare class GymOwner extends Manager {
    gyms: Gym[];
}
export declare const GymOwnerSchema: import("mongoose").Schema<GymOwner, import("mongoose").Model<GymOwner, any, any, any, import("mongoose").Document<unknown, any, GymOwner, any> & GymOwner & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, GymOwner, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<GymOwner>, {}> & import("mongoose").FlatRecord<GymOwner> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
