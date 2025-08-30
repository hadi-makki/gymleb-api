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

  private async seedManagers() {
    const username = 'admin';
    const email = 'admin@example.com';

    const exists = await this.managerRepository.findOne({
      where: [{ username }, { email }],
    });

    const randomPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await ManagerEntity.hashPassword(randomPassword);
    const checkPassword = await ManagerEntity.isPasswordMatch(
      randomPassword,
      hashedPassword,
    );
    console.log('checkPassword', checkPassword);
    console.log('hashedPassword', hashedPassword);
    console.log('randomPassword', randomPassword);
    if (!exists) {
      const hashedPassword = await ManagerEntity.hashPassword('Password1$');
      const manager = this.managerRepository.create({
        username,
        email,
        password: hashedPassword,
        permissions: [Permissions.SuperAdmin],
      });
      await this.managerRepository.save(manager);
      console.log('Admin seeded');
    }
  }
}
