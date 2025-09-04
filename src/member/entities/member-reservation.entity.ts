import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';
import { MemberEntity } from './member.entity';
import { GymEntity } from '../../gym/entities/gym.entity';

@Entity('member_reservations')
export class MemberReservationEntity extends PgMainEntity {
  @ManyToOne(() => MemberEntity, (member) => member.reservations)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @RelationId((reservation: MemberReservationEntity) => reservation.member)
  memberId: string;

  @ManyToOne(() => GymEntity, (gym) => gym.reservations)
  @JoinColumn({ name: 'gymId' })
  gym: GymEntity;

  @RelationId((reservation: MemberReservationEntity) => reservation.gym)
  gymId: string;

  @Column('date')
  reservationDate: Date;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  @Column('text')
  dayOfWeek: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  notes: string;
}
