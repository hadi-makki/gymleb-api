import { CustomSchema } from '../decorators/custom-schema.decorator';
import { PgMainEntity } from '../main-classes/mainEntity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MediaEntity } from 'src/media/media.entity';
import { ProductsOffersEntity } from './products-offers.entity';

@Entity('products')
export class ProductEntity extends PgMainEntity {
  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  stripeProductId: string;

  @Column('float')
  price: number;

  @Column('text', { nullable: true })
  description: string;

  @OneToMany(() => MediaEntity, (media) => media.product)
  images: MediaEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.product, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  transactions: TransactionEntity[];

  @Column('int', { default: 600 })
  maxDurationSeconds: number;

  @ManyToOne(() => GymEntity, (gym) => gym.products)
  gym: GymEntity;

  @RelationId((product: ProductEntity) => product.gym)
  gymId: string | null;

  @Column('int', { default: 0 })
  stock: number;

  @Column('uuid', { nullable: true })
  originalProductId: string | null;

  @Column('uuid', { nullable: true })
  transferedFromId: string | null;
}
