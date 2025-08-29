import { OnModuleInit } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { InjectModel } from '@nestjs/mongoose';
import { Manager } from './manager.model';
import { Model } from 'mongoose';

export class ManagerScript implements OnModuleInit {
  constructor(
    private readonly managerService: ManagerService,
    @InjectModel(Manager.name) private managerModel: Model<Manager>,
  ) {}
  async onModuleInit() {
    // const managers = await this.managerModel.find();
    // for (const manager of managers) {
    //   if (manager.gyms.length === 0 && manager.gym) {
    //     manager.gyms = [];
    //     manager.gyms.push(manager.gym);
    //   }
    //   await this.managerModel.updateOne(
    //     { _id: manager._id },
    //     { gyms: manager.gyms },
    //   );
    // }
    console.log('Manager module has been initialized.');
    // You can add any initialization logic here
  }
}
