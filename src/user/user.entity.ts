import * as bcrypt from 'bcryptjs';
import { PgMainEntity } from 'src/main-classes/mainEntity';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class UserEntity extends PgMainEntity {
  @Column('text')
  email: string;

  @Column('text', { nullable: true })
  password: string;

  @Column('text')
  name: string;

  async comparePassword(oldPassword: string) {
    return await bcrypt.compare(oldPassword, this.password);
  }
}
