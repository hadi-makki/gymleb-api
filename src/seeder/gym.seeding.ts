import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';

export const Days = [
  { day: 'Monday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
  { day: 'Tuesday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
  {
    day: 'Wednesday',
    isOpen: true,
    openingTime: '09:00',
    closingTime: '17:00',
  },
  { day: 'Thursday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
  { day: 'Friday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
  { day: 'Saturday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
  { day: 'Sunday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
];

@Injectable({ scope: Scope.DEFAULT })
export class GymSeeding implements OnModuleInit {
  constructor(
    @InjectRepository(GymEntity)
    private gymRepository: Repository<GymEntity>,
    @InjectRepository(ManagerEntity)
    private managerRepository: Repository<ManagerEntity>,
  ) {}

  async onModuleInit() {
    // await this.removeData();
    await this.seedGyms();
    // await this.addDashedGymName();
  }

  private async removeData() {
    await this.gymRepository.delete({});
  }

  async addDashedGymName() {
    const gyms = await this.gymRepository.find({});
    for (const gym of gyms) {
      gym.gymDashedName = gym.name.toLowerCase().split(' ').join('-');
      await this.gymRepository.save(gym);
    }
  }

  private async seedGyms() {
    const name = 'Gym 1';
    const address = '123 Main St';
    const phone = '1234567890';
    const email = 'gym1@example.com';

    const getManager = await this.managerRepository.findOne({
      where: { username: 'admin' },
    });

    const exists = await this.gymRepository.findOne({
      where: { name },
    });

    if (!exists && getManager) {
      const gym = this.gymRepository.create({
        name,
        address,
        phone,
        email,
        owner: getManager,
        openingDays: Days,
      });
      await this.gymRepository.save(gym);
      console.log('Gym seeded');
    }
  }
}
