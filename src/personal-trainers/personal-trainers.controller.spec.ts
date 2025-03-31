import { Test, TestingModule } from '@nestjs/testing';
import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';

describe('PersonalTrainersController', () => {
  let controller: PersonalTrainersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalTrainersController],
      providers: [PersonalTrainersService],
    }).compile();

    controller = module.get<PersonalTrainersController>(PersonalTrainersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
