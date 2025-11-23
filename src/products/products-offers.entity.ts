import { PgMainEntity } from 'src/main-classes/mainEntity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  RelationId,
  JoinColumn,
} from 'typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';

@Entity('products_offers')
export class ProductsOffersEntity extends PgMainEntity {
  @Column('text')
  name: string;

  @Column('float')
  discountPercentage: number;

  @ManyToOne(() => GymEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gymId' })
  gym: GymEntity;

  @RelationId((offer: ProductsOffersEntity) => offer.gym)
  gymId: string | null;

  @OneToMany(() => TransactionEntity, (product) => product.offer)
  products: TransactionEntity[];

  @OneToMany(() => RevenueEntity, (revenue) => revenue.offer)
  productRevenues: RevenueEntity[];
}
