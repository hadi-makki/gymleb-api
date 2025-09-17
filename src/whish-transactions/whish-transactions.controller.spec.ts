import { Test, TestingModule } from '@nestjs/testing';
import { WhishTransactionsController } from './whish-transactions.controller';
import { WhishTransactionsService } from './whish-transactions.service';

describe('WhishTransactionsController', () => {
  let controller: WhishTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhishTransactionsController],
      providers: [WhishTransactionsService],
    }).compile();

    controller = module.get<WhishTransactionsController>(WhishTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
