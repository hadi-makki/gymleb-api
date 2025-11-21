import { Test, TestingModule } from '@nestjs/testing';
import { PersonalScheduleService } from './personal-schedule.service';

describe('PersonalScheduleService', () => {
  let service: PersonalScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalScheduleService],
    }).compile();

    service = module.get<PersonalScheduleService>(PersonalScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
