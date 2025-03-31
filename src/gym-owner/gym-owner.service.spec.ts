import { Test, TestingModule } from '@nestjs/testing';
import { GymOwnerService } from './gym-owner.service';

describe('GymOwnerService', () => {
  let service: GymOwnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GymOwnerService],
    }).compile();

    service = module.get<GymOwnerService>(GymOwnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
