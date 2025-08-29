import { ManagerEntity } from 'src/manager/manager.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';
import { OwnerSubscriptionTypeEntity } from './owner-subscription-type.entity';

@Entity('owner_subscriptions')
export class OwnerSubscriptionEntity extends PgMainEntity {
  @ManyToOne(() => ManagerEntity, (manager) => manager.ownerSubscription)
  owner: ManagerEntity;

  @RelationId(
    (ownerSubscription: OwnerSubscriptionEntity) => ownerSubscription.owner,
  )
  ownerId: string | null;

  @ManyToOne(
    () => OwnerSubscriptionTypeEntity,
    (type) => type.ownerSubscription,
  )
  type: OwnerSubscriptionTypeEntity;

  @RelationId(
    (ownerSubscription: OwnerSubscriptionEntity) => ownerSubscription.type,
  )
  typeId: string | null;

  @Column('timestamp with time zone')
  startDate: Date;

  @Column('timestamp with time zone')
  endDate: Date;

  @Column('boolean', { default: true })
  active: boolean;

  // @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  // transaction: Transaction;
}
