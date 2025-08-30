import { PgMainEntity } from '../../main-classes/mainEntity';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { GymEntity } from './gym.entity';

@Entity('gym_presets')
export class GymPresetEntity extends PgMainEntity {
  @ManyToOne(() => GymEntity, (gym) => gym.presets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gymId' })
  gym: GymEntity;

  @RelationId((preset: GymPresetEntity) => preset.gym)
  gymId: string;

  @Column('text')
  name: string;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  @Column('text', { nullable: true })
  description: string | null;
}
