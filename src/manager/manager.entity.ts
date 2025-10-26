import * as bcrypt from 'bcryptjs';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MediaEntity } from 'src/media/media.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { TokenEntity } from 'src/token/token.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Permissions } from '../decorators/roles/role.enum';
import { PgMainEntity } from '../main-classes/mainEntity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { WhishTransaction } from 'src/whish-transactions/entities/whish-transaction.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';

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

  // Gyms owned by this manager (inverse side of GymEntity.owner)
  @OneToMany(() => GymEntity, (gym) => gym.owner)
  ownedGyms: GymEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.owner, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  transactions: TransactionEntity[];

  @OneToMany(() => MediaEntity, (media) => media.manager)
  media: MediaEntity[];

  @OneToOne(() => MediaEntity, (media) => media.managers)
  @JoinColumn({ name: 'profileImageId' })
  profileImage: MediaEntity;

  @OneToMany(() => PTSessionEntity, (session) => session.personalTrainer)
  ptSessions: PTSessionEntity[];

  @OneToMany(() => MemberEntity, (member) => member.personalTrainer)
  members: MemberEntity[];

  @Column('boolean', { default: false })
  isReadOnlyPersonalTrainer: boolean;

  @Column('time', { nullable: true })
  shiftStartTime: string;

  @Column('time', { nullable: true })
  shiftEndTime: string;

  @Column('text', { nullable: true })
  description: string;

  @OneToMany(() => RevenueEntity, (revenue) => revenue.createdBy)
  createdRevenues: RevenueEntity[];

  @Column('decimal', { default: 1 })
  ptSessionDurationHours: number;

  @Column('int', { default: 1 })
  maxMembersPerSession: number;

  @Column('simple-array', {
    default: 'monday,tuesday,wednesday,thursday,friday',
  })
  workingDays: string[];

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
