import { PgMainEntity } from 'src/main-classes/mainEntity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';

@Entity('users')
export class UserEntity extends PgMainEntity {
  @Column('text', { nullable: true })
  name: string;

  @Column('text', { nullable: true })
  @Index()
  phone: string | null;

  @Column('text', { default: 'LB', nullable: true })
  phoneNumberISOCode: string | null;

  @OneToMany(() => MemberEntity, (member) => member.user, {
    onDelete: 'SET NULL',
  })
  members: MemberEntity[];
}
