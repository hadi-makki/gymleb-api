import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';
import { GymEntity } from '../../gym/entities/gym.entity';
import { MemberEntity } from '../../member/entities/member.entity';
import { ManagerEntity } from '../../manager/manager.entity';

@Entity('personal_schedules')
export class PersonalScheduleEntity extends PgMainEntity {
  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('timestamp without time zone')
  startDate: Date;

  @Column('decimal', { default: 1 })
  durationHours: number;

  @Column('text', { nullable: true })
  location: string | null;

  @ManyToOne(() => GymEntity, (gym) => gym.personalSchedules, {
    onDelete: 'CASCADE',
  })
  gym: GymEntity;

  @RelationId((schedule: PersonalScheduleEntity) => schedule.gym)
  gymId: string;

  @Column('text')
  userType: 'member' | 'manager';

  @ManyToOne(() => MemberEntity, (member) => member.personalSchedules, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity | null;

  @RelationId((schedule: PersonalScheduleEntity) => schedule.member)
  memberId: string | null;

  @ManyToOne(() => ManagerEntity, (manager) => manager.personalSchedules, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'managerId' })
  manager: ManagerEntity | null;

  @RelationId((schedule: PersonalScheduleEntity) => schedule.manager)
  managerId: string | null;
}
