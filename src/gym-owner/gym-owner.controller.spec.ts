import { Test, TestingModule } from '@nestjs/testing';
import { GymOwnerController } from './gym-owner.controller';
import { GymOwnerService } from './gym-owner.service';

describe('GymOwnerController', () => {
  let controller: GymOwnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymOwnerController],
      providers: [GymOwnerService],
    }).compile();

    controller = module.get<GymOwnerController>(GymOwnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
