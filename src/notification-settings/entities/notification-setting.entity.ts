import { PgMainEntity } from 'src/main-classes/mainEntity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('notification_settings')
export class NotificationSettingEntity extends PgMainEntity {
  @Column('boolean', { default: false })
  welcomeMessage: boolean;

  @Column('boolean', { default: false })
  monthlyReminder: boolean;

  @OneToMany(() => MemberEntity, (member) => member.notificationSetting)
  members: MemberEntity[];
}
