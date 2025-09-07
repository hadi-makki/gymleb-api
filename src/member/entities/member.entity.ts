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
import { MemberReservationEntity } from './member-reservation.entity';
import * as bcrypt from 'bcrypt';
import { MemberTrainingProgramEntity } from './member-training-program.entity';

export enum TrainingLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum TrainingGoals {
  LOSE_WEIGHT = 'lose_weight',
  BUILD_MUSCLE = 'build_muscle',
  IMPROVE_HEALTH = 'improve_health',
}

export enum TrainingPreferences {
  GYM = 'gym',
  HOME = 'home',
  OUTDOORS = 'outdoors',
}

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

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.members, {
    onDelete: 'SET NULL',
  })
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

  @OneToMany(() => TokenEntity, (token) => token.member, {
    onDelete: 'CASCADE',
  })
  tokens: TokenEntity[];

  @OneToMany(
    () => MemberAttendingDaysEntity,
    (attendingDay) => attendingDay.member,
    {
      onDelete: 'SET NULL',
    },
  )
  attendingDays: MemberAttendingDaysEntity[];

  @OneToMany(
    () => MemberReservationEntity,
    (reservation) => reservation.member,
    {
      onDelete: 'SET NULL',
    },
  )
  reservations: MemberReservationEntity[];

  @Column('text', { nullable: true })
  trainingLevel: string | null;

  @Column('text', { nullable: true })
  trainingGoals: string | null;

  @Column('text', { nullable: true })
  trainingPreferences: string | null;

  @OneToMany(
    () => MemberTrainingProgramEntity,
    (trainingProgram) => trainingProgram.member,
    {
      onDelete: 'SET NULL',
    },
  )
  trainingPrograms: MemberTrainingProgramEntity[];

  // Health Information Fields
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weight: number | null; // in kg

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  height: number | null; // in cm

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  waistWidth: number | null; // in cm

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  chestWidth: number | null; // in cm

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  armWidth: number | null; // in cm

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  thighWidth: number | null; // in cm

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  bodyFatPercentage: number | null; // in percentage

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  muscleMass: number | null; // in kg

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  bmi: number | null; // Body Mass Index

  @Column('text', { nullable: true })
  bloodType: string | null;

  @Column('text', { nullable: true })
  allergies: string | null;

  @Column('text', { nullable: true })
  medicalConditions: string | null;

  @Column('text', { nullable: true })
  medications: string | null;

  @Column('text', { nullable: true })
  emergencyContact: string | null;

  @Column('text', { nullable: true })
  emergencyPhone: string | null;

  @Column('timestamp', { nullable: true })
  lastHealthCheck: Date | null;

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
