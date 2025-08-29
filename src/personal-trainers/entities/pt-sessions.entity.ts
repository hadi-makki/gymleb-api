import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { MainEntity, PgMainEntity } from 'src/main-classes/mainEntity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';

@Entity('pt_sessions')
export class PTSessionEntity extends PgMainEntity {
  @ManyToOne(() => ManagerEntity, (manager) => manager.ptSessions)
  personalTrainer: ManagerEntity;

  @RelationId((ptSession: PTSessionEntity) => ptSession.personalTrainer)
  personalTrainerId: string | null;

  @ManyToOne(() => MemberEntity, (member) => member.ptSessions)
  member: MemberEntity;

  @RelationId((ptSession: PTSessionEntity) => ptSession.member)
  memberId: string | null;

  @Column('timestamp with time zone', { nullable: true })
  sessionDate: Date;

  @Column('boolean', { default: false })
  isCancelled: boolean;

  @Column('text', { nullable: true })
  cancelledReason: string;

  @Column('timestamp with time zone', { nullable: true })
  cancelledAt: Date;

  @ManyToOne(() => GymEntity, (gym) => gym.ptSessions)
  gym: GymEntity;

  @RelationId((ptSession: PTSessionEntity) => ptSession.gym)
  gymId: string | null;

  @Column('int', { nullable: true })
  sessionPrice: number;
}
