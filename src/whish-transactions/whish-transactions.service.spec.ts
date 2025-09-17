import { Test, TestingModule } from '@nestjs/testing';
import { WhishTransactionsService } from './whish-transactions.service';

describe('WhishTransactionsService', () => {
  let service: WhishTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhishTransactionsService],
    }).compile();

    service = module.get<WhishTransactionsService>(WhishTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
