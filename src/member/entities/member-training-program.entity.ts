import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { MemberEntity } from './member.entity';
import { PgMainEntity } from 'src/main-classes/mainEntity';

export enum ProgramKey {
  traps = 'traps',
  chest = 'chest',
  shoulders = 'shoulders',
  back = 'back',
  biceps = 'biceps',
  triceps = 'triceps',
  legs = 'legs',
  abs = 'abs',
}

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

  @Column({ type: 'text' })
  programKey: string;

  @Column('text')
  name: string;

  @Column('jsonb')
  exercises: {
    name: string;
    sets: {
      reps: number;
      weight?: number;
    }[];
    reps?: number;
    weight?: number;
  }[];
}
