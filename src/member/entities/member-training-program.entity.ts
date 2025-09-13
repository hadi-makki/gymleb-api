import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { MemberEntity } from './member.entity';
import { PgMainEntity } from 'src/main-classes/mainEntity';
import { DayOfWeek } from './member-attending-days.entity';

@Entity('member_training_programs')
export class MemberTrainingProgramEntity extends PgMainEntity {
  @ManyToOne(() => MemberEntity, (member) => member.trainingPrograms, {
    onDelete: 'CASCADE',
  })
  member: MemberEntity;

  @RelationId(
    (trainingProgram: MemberTrainingProgramEntity) => trainingProgram.member,
  )
  memberId: string;

  @Column('text')
  dayOfWeek: DayOfWeek;

  @Column('text')
  name: string;

  @Column('jsonb')
  exercises: {
    name: string;
    sets: {
      reps: number;
      weight?: number;
    }[];
  }[];
}
