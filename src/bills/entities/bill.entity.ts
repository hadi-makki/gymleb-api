import { GymEntity } from 'src/gym/entities/gym.entity';
import { Currency } from 'src/common/enums/currency.enum';
import { Column, Entity, ManyToOne, RelationId, JoinColumn } from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';

export enum BillType {
  FIXED = 'FIXED',
  DYNAMIC = 'DYNAMIC',
}

@Entity('bills')
export class BillEntity extends PgMainEntity {
  @Column('text')
  title: string;

  @Column('float')
  amount: number;

  @Column('text', { default: Currency.USD })
  currency: Currency;

  @Column('int')
  dueDate: number; // Day of month (1-31)

  @Column('text', { default: BillType.FIXED })
  billType: BillType;

  @Column('timestamp without time zone', { nullable: true })
  paidAt: Date | null;

  @Column('timestamp without time zone', { nullable: true })
  lastMonthPaidAt: Date | null;

  @ManyToOne(() => GymEntity, (gym) => gym.bills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gymId' })
  gym: GymEntity;

  @RelationId((bill: BillEntity) => bill.gym)
  gymId: string | null;
}
