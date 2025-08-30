import { PgMainEntity } from '../../main-classes/mainEntity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { MemberEntity } from './member.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('member_attending_days')
export class MemberAttendingDaysEntity extends PgMainEntity {
  @ManyToOne(() => MemberEntity, (member) => member.attendingDays, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @RelationId((attendingDay: MemberAttendingDaysEntity) => attendingDay.member)
  memberId: string;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @Column('time', { nullable: true })
  startTime: string | null;

  @Column('time', { nullable: true })
  endTime: string | null;

  @Column('boolean', { default: true })
  isActive: boolean;
}
