import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permissions } from '../decorators/roles/role.enum';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class ManagerSeeding implements OnModuleInit {
  constructor(
    @InjectRepository(ManagerEntity)
    private managerRepository: Repository<ManagerEntity>,
  ) {}

  async onModuleInit() {
    // await this.removeData();
    await this.seedManagers();
  }

  private async removeData() {
    await this.managerRepository.delete({});
  }

  private async seedManagers() {
    const username = 'admin';
    const email = 'admin@example.com';

    const exists = await this.managerRepository.findOne({
      where: [{ username }, { email }],
    });
    if (!exists) {
      const hashedPassword = await ManagerEntity.hashPassword('Password1$');
      await this.managerRepository.create({
        username,
        email,
        password: hashedPassword,
        permissions: [Permissions.SuperAdmin],
      });
      console.log('Admin seeded');
    }
  }
}
