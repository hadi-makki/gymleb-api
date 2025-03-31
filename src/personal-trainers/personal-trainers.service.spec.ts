import { Test, TestingModule } from '@nestjs/testing';
import { PersonalTrainersService } from './personal-trainers.service';

describe('PersonalTrainersService', () => {
  let service: PersonalTrainersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalTrainersService],
    }).compile();

    service = module.get<PersonalTrainersService>(PersonalTrainersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
