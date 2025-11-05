import { Column, Entity, Index, ManyToOne, RelationId } from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';
import { GymEntity } from './gym.entity';

export enum MessageTemplateType {
  WELCOME = 'WELCOME',
  MONTHLY_REMINDER = 'MONTHLY_REMINDER',
  PT_SCHEDULE = 'PT_SCHEDULE',
  PT_END_CONFIRMATION = 'PT_END_CONFIRMATION',
}

@Entity('message_templates')
@Index(['gymId', 'type'], { unique: true })
export class MessageTemplateEntity extends PgMainEntity {
  @ManyToOne(() => GymEntity, (gym) => gym.messageTemplates, {
    onDelete: 'CASCADE',
  })
  gym: GymEntity;

  @RelationId((t: MessageTemplateEntity) => t.gym)
  @Column('text')
  gymId: string;

  @Column('text')
  type: MessageTemplateType;

  @Column('text')
  content: string;
}
