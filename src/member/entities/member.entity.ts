import { PgMainEntity } from '../../main-classes/mainEntity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { TokenEntity } from 'src/token/token.entity';
import { MediaEntity } from 'src/media/media.entity';
import { MemberAttendingDaysEntity } from './member-attending-days.entity';
import * as bcrypt from 'bcrypt';

@Entity('members')
export class MemberEntity extends PgMainEntity {
  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  email: string;

  @Column('text')
  phone: string;

  @ManyToOne(() => GymEntity, (gym) => gym.members)
  gym: GymEntity;

  @RelationId((member: MemberEntity) => member.gym)
  gymId: string | null;

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.members)
  subscription: SubscriptionEntity;

  @RelationId((member: MemberEntity) => member.subscription)
  subscriptionId: string | null;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.member)
  transactions: TransactionEntity[];

  @Column('boolean', { default: false })
  isNotified: boolean;

  @ManyToOne(() => MediaEntity, (media) => media.members)
  @JoinColumn({ name: 'profileImageId' })
  profileImage: MediaEntity;

  @OneToMany(() => PTSessionEntity, (session) => session.member)
  ptSessions: PTSessionEntity[];

  @ManyToMany(() => PTSessionEntity, (session) => session.members)
  userPtSessions: PTSessionEntity[];

  @Column('text', { nullable: true })
  password: string | null;

  @Column('boolean', { default: false })
  isWelcomeMessageSent: boolean;

  @ManyToOne(() => ManagerEntity, (manager) => manager.members)
  personalTrainer: ManagerEntity;

  @OneToMany(() => TokenEntity, (token) => token.member)
  tokens: TokenEntity[];

  @OneToMany(
    () => MemberAttendingDaysEntity,
    (attendingDay) => attendingDay.member,
  )
  attendingDays: MemberAttendingDaysEntity[];

  static async isPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
