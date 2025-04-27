import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { PersonalTrainer } from './entities/personal-trainer.entity';
import { Model } from 'mongoose';
import { User } from '../user/user.entity';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
export declare class PersonalTrainersService {
    private readonly personalTrainerEntity;
    private readonly userEntity;
    constructor(personalTrainerEntity: Model<PersonalTrainer>, userEntity: Model<User>);
    create(createPersonalTrainerDto: CreatePersonalTrainerDto): Promise<import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAll(): import("mongoose").Query<(import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[], import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}, PersonalTrainer, "find", {}>;
    findOne(id: string): import("mongoose").Query<import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}, PersonalTrainer, "findOne", {}>;
    update(id: string, updatePersonalTrainerDto: UpdatePersonalTrainerDto): import("mongoose").Query<import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}, PersonalTrainer, "findOneAndUpdate", {}>;
    remove(id: string): import("mongoose").Query<import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, import("mongoose").Document<unknown, {}, PersonalTrainer, {}> & PersonalTrainer & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}, PersonalTrainer, "findOneAndDelete", {}>;
    findAllUsers(personalTrainer: PersonalTrainer): import("mongoose").Query<(import("mongoose").Document<unknown, {}, User, {}> & User & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[], import("mongoose").Document<unknown, {}, User, {}> & User & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}, User, "find", {}>;
    addUserToPersonalTrainer(addPersonalTrainerDto: AddPersonalTrainerDto, personalTrainer: PersonalTrainer): Promise<{
        message: string;
    }>;
}
