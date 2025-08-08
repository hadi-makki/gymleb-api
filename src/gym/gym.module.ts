import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GymOwner,
  GymOwnerSchema,
} from '../gym-owner/entities/gym-owner.entity';
import { Gym, GymSchema } from './entities/gym.entity';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/transaction.entity';
import { Member, MemberSchema } from '../member/entities/member.entity';
import { Expense, ExpenseSchema } from '../expenses/expense.entity';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Gym.name, schema: GymSchema },
      { name: GymOwner.name, schema: GymOwnerSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [GymController],
  providers: [GymService],
  exports: [GymService],
})
export class GymModule {}
