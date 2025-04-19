import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from 'src/decorators/roles/role.enum';
import { Gym } from 'src/gym/entities/gym.entity';
import { Manager } from 'src/manager/manager.entity';

@Injectable({ scope: Scope.DEFAULT })
export class GymSeeding implements OnModuleInit {
  constructor(
    @InjectModel(Gym.name)
    private gymRepository: Model<Gym>,
    @InjectModel(Manager.name)
    private managerRepository: Model<Manager>,
  ) {}

  async onModuleInit() {
    // await this.removeData();
    await this.seedGyms();
  }

  private async removeData() {
    await this.gymRepository.deleteMany({});
  }

  private async seedGyms() {
    const name = 'Gym 1';
    const address = '123 Main St';
    const phone = '1234567890';
    const email = 'gym1@example.com';

    const getManager = await this.managerRepository.findOne({
      username: 'admin',
    });

    const exists = await this.gymRepository.findOne({
      name,
    });
    if (!exists && getManager) {
      await this.gymRepository.create({
        name,
        address,
        phone,
        email,
        owner: getManager.id,
      });
      console.log('Gym seeded');
    }
  }
}
