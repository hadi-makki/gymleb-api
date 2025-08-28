import { Prop, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { Permissions } from '../decorators/roles/role.enum';
import { GymEntity } from '../gym/entities/gym.entity';
import { MainEntity, PgMainEntity } from '../main-classes/mainEntity';
import { OwnerSubscription } from '../owner-subscriptions/owner-subscription.model';
import Token from '../token/token.model';
import { Column, Entity, OneToMany } from 'typeorm';
import { TokenEntity } from 'src/token/token.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';

@Entity('managers')
export class ManagerEntity extends PgMainEntity {
  @Column({ unique: true })
  username: string;

  @Column({ default: 'John' })
  firstName: string;

  @Column({ default: 'Doe' })
  lastName: string;

  @Column()
  password: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => TokenEntity, (token) => token.manager)
  tokens: TokenEntity[];

  @Column({ type: 'jsonb', default: [] })
  roles: Permissions[];

  @OneToMany(() => GymEntity, (gym) => gym.owner)
  gyms: GymEntity[];

  @OneToMany(
    () => OwnerSubscriptionEntity,
    (ownerSubscription) => ownerSubscription.owner,
  )
  ownerSubscription?: OwnerSubscriptionEntity;

  static async isPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
