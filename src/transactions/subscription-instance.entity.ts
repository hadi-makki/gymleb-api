import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';

@Entity('subscription_instances')
export class SubscriptionInstanceEntity extends PgMainEntity {
  @Column('timestamp with time zone')
  endDate: string;

  @Column('timestamp with time zone', { nullable: true })
  startDate: string;

  @Column('float')
  paidAmount: number;

  @ManyToOne(() => GymEntity, (gym) => gym.subscriptionInstances)
  gym: GymEntity;

  @RelationId(
    (subscriptionInstance: SubscriptionInstanceEntity) =>
      subscriptionInstance.gym,
  )
  gymId: string | null;

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.instances)
  subscription: SubscriptionEntity;

  @RelationId(
    (subscriptionInstance: SubscriptionInstanceEntity) =>
      subscriptionInstance.subscription,
  )
  subscriptionId: string | null;

  @ManyToOne(() => MemberEntity, (member) => member.subscriptionInstances)
  member: MemberEntity;

  @RelationId(
    (subscriptionInstance: SubscriptionInstanceEntity) =>
      subscriptionInstance.member,
  )
  memberId: string | null;

  // Owner subscription assignment transaction
  @ManyToOne(() => ManagerEntity, (manager) => manager.ownerSubscription)
  owner: ManagerEntity;

  @RelationId(
    (subscriptionInstance: SubscriptionInstanceEntity) =>
      subscriptionInstance.owner,
  )
  ownerId: string | null;

  @ManyToOne(
    () => OwnerSubscriptionTypeEntity,
    (ownerSubscriptionType) => ownerSubscriptionType.instances,
  )
  ownerSubscriptionType: OwnerSubscriptionTypeEntity;

  @RelationId(
    (subscriptionInstance: SubscriptionInstanceEntity) =>
      subscriptionInstance.ownerSubscriptionType,
  )
  ownerSubscriptionTypeId: string | null;

  @Column('boolean', { default: false })
  isOwnerSubscriptionAssignment: boolean;

  @Column('text', { nullable: true })
  paidBy: string;

  @Column('boolean', { default: false })
  isInvalidated: boolean;
}
