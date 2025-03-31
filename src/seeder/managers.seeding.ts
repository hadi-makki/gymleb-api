import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from 'src/decorators/roles/role.enum';
import { Manager } from 'src/manager/manager.entity';

@Injectable({ scope: Scope.DEFAULT })
export class ManagerSeeding implements OnModuleInit {
  constructor(
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
  ) {}

  async onModuleInit() {
    // await this.removeData();
    await this.seedManagers();
  }

  private async removeData() {
    await this.managerRepository.deleteMany({});
  }

  private async seedManagers() {
    const username = 'admin';
    const email = 'admin@example.com';

    const exists = await this.managerRepository.findOne({
      username,
      email,
    });
    if (!exists) {
      const hashedPassword = await Manager.hashPassword('Password1$');
      await this.managerRepository.create({
        username,
        email,
        password: hashedPassword,
        roles: [Role.SuperAdmin],
      });
      console.log('Admin seeded');
    }
  }
}
