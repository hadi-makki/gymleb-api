import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/transaction.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [AuthenticationModule, TransactionModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
