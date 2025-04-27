import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { PersonalTrainer } from './entities/personal-trainer.entity';
import { PersonalTrainersService } from './personal-trainers.service';
export declare class PersonalTrainersController {
    private readonly personalTrainersService;
    constructor(personalTrainersService: PersonalTrainersService);
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
    findAllUsers(personalTrainer: PersonalTrainer): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../user/user.entity").User, {}> & import("../user/user.entity").User & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[], import("mongoose").Document<unknown, {}, import("../user/user.entity").User, {}> & import("../user/user.entity").User & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, {}, import("../user/user.entity").User, "find", {}>;
    addUserToPersonalTrainer(addUserToPersonalTrainerDto: AddPersonalTrainerDto, personalTrainer: PersonalTrainer): Promise<{
        message: string;
    }>;
}
