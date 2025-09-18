import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionInstanceService } from './transaction.service';

describe('TransactionsService', () => {
  let service: SubscriptionInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionInstanceService],
    }).compile();

    service = module.get<SubscriptionInstanceService>(
      SubscriptionInstanceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
