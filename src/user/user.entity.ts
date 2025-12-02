import { PgMainEntity } from 'src/main-classes/mainEntity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';
import { MediaEntity } from 'src/media/media.entity';
import {
  TrainingLevel,
  TrainingGoals,
  TrainingPreferences,
} from 'src/member/entities/member.entity';

@Entity('users')
export class UserEntity extends PgMainEntity {
  @Column('text', { nullable: true })
  name: string;

  @Column('text', { nullable: true })
  @Index()
  phone: string | null;

  @Column('text', { default: 'LB', nullable: true })
  phoneNumberISOCode: string | null;

  @ManyToOne(() => MediaEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'profileImageId' })
  profileImage: MediaEntity;

  @Column('text', { nullable: true })
  trainingLevel: TrainingLevel | null;

  @Column('text', { nullable: true })
  trainingGoals: TrainingGoals | null;

  @Column('text', { nullable: true })
  trainingPreferences: TrainingPreferences | null;

  @OneToMany(() => MemberEntity, (member) => member.user, {
    onDelete: 'SET NULL',
  })
  members: MemberEntity[];

  @Column('int', { default: 0 })
  notificationCount: number; // Counter for unread notifications

  @Column('boolean', { default: false })
  hasDownloadedApp: boolean;

  @Column('timestamp without time zone', { nullable: true })
  downloadedAt: Date | null;

  @Column('boolean', { default: false })
  isDeactivated: boolean;
}
