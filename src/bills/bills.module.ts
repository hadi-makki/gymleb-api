import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { BillEntity } from './entities/bill.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillEntity, GymEntity]),
    ExpensesModule,
    AuthenticationModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
