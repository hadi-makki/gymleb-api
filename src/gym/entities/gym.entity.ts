import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { MainEntity, PgMainEntity } from '../../main-classes/mainEntity';
import { Manager } from '../../manager/manager.model';
import { Subscription } from '../../subscription/entities/subscription.model';
import { SubscriptionInstance } from '../../transactions/subscription-instance.entity';
import { Transaction } from '../../transactions/transaction.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';

@Entity('gyms')
export class GymEntity extends PgMainEntity {
  @Column('text')
  name: string;

  @Column('text')
  gymDashedName: string;

  @Column('text')
  address: string;

  @Column('text')
  phone: string;

  @ManyToMany(() => ManagerEntity, (manager) => manager.gyms)
  personalTrainers: ManagerEntity[];

  @Prop({ type: [Types.ObjectId], ref: 'Subscription', required: false })
  subscriptions: Subscription[];

  @ManyToOne(() => ManagerEntity, (manager) => manager.gyms)
  owner: ManagerEntity;

  @Prop({
    type: [Types.ObjectId],
    ref: 'SubscriptionInstance',
    required: false,
  })
  subscriptionInstances: SubscriptionInstance[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'Transaction',
    required: false,
    default: [],
  })
  transactions: Transaction[];

  @Prop({ type: Boolean, default: false })
  finishedPageSetup: boolean;

  @Prop({
    type: [
      {
        day: String,
        openingTime: String,
        closingTime: String,
        isOpen: Boolean,
      },
    ],
    required: false,
  })
  openingDays: {
    day: string;
    openingTime: string;
    closingTime: string;
    isOpen: boolean;
  }[];

  @Prop({ type: Number, default: 0 })
  membersNotified: number;

  @Prop({
    type: [
      {
        day: String,
        from: String,
        to: String,
      },
    ],
    required: false,
    default: [],
  })
  womensTimes: {
    day: string;
    from: string;
    to: string;
  }[];

  @Prop({ type: String, required: false, default: '' })
  note: string;

  @Prop({
    type: [
      {
        description: String,
      },
    ],
    required: false,
    default: [],
  })
  offers: { description: string }[];

  @Prop({ type: Number, default: 0, required: false })
  gymsPTSessionPercentage: number;
}
