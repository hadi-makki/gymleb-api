import { ManagerEntity } from 'src/manager/manager.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';
import { User } from '../user/user.entity';

export enum TokenType {
  Access = 'access',
  Refresh = 'refresh',
  ResetPassword = 'reset-password',
}

@Entity('tokens')
export class TokenEntity extends PgMainEntity {
  @Column({ unique: true, default: null })
  accessToken: string;

  @Column({ unique: true, default: null })
  refreshToken: string;

  @Column({ type: 'timestamp with time zone', default: null })
  refreshExpirationDate: Date;

  @Column({ type: 'timestamp with time zone', default: null })
  accessExpirationDate: Date;

  @Column({ default: null })
  deviceId: string;

  @Column({ nullable: true })
  user: User;

  // @Column({ nullable: true })
  // member: Member;

  @ManyToOne(() => ManagerEntity, (manager) => manager.tokens, {
    nullable: true,
  })
  manager: ManagerEntity;

  @RelationId((token: TokenEntity) => token.manager)
  managerId: string;
}
