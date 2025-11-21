import { Test, TestingModule } from '@nestjs/testing';
import { PersonalScheduleController } from './personal-schedule.controller';
import { PersonalScheduleService } from './personal-schedule.service';

describe('PersonalScheduleController', () => {
  let controller: PersonalScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalScheduleController],
      providers: [PersonalScheduleService],
    }).compile();

    controller = module.get<PersonalScheduleController>(PersonalScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
