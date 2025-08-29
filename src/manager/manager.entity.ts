import * as bcrypt from 'bcrypt';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MediaEntity } from 'src/media/media.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { TokenEntity } from 'src/token/token.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { Permissions } from '../decorators/roles/role.enum';
import { PgMainEntity } from '../main-classes/mainEntity';
import { MemberEntity } from 'src/member/entities/member.entity';

@Entity('managers')
export class ManagerEntity extends PgMainEntity {
  @Column({ unique: true })
  username: string;

  @Column({ default: 'John' })
  firstName: string;

  @Column({ default: 'Doe' })
  lastName: string;

  @Column()
  password: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('text', { nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => TokenEntity, (token) => token.manager)
  tokens: TokenEntity[];

  @Column({ type: 'jsonb', default: [] })
  permissions: Permissions[];

  @ManyToMany(() => GymEntity, (gym) => gym.personalTrainers)
  @JoinTable()
  gyms: GymEntity[];

  @OneToMany(
    () => OwnerSubscriptionEntity,
    (ownerSubscription) => ownerSubscription.owner,
  )
  ownerSubscription?: OwnerSubscriptionEntity;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.owner)
  transactions: TransactionEntity[];

  @OneToMany(() => MediaEntity, (media) => media.manager)
  media: MediaEntity[];

  @OneToMany(() => PTSessionEntity, (session) => session.personalTrainer)
  ptSessions: PTSessionEntity[];

  @OneToMany(() => MemberEntity, (member) => member.personalTrainer)
  members: MemberEntity[];

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
