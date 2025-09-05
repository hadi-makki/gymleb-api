import { PgMainEntity } from 'src/main-classes/mainEntity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('products_offers')
export class ProductsOffersEntity extends PgMainEntity {
  @Column('text')
  name: string;

  @Column('float')
  discountPercentage: number;

  @OneToMany(() => TransactionEntity, (product) => product.offer)
  products: TransactionEntity[];

  @OneToMany(() => RevenueEntity, (revenue) => revenue.offer)
  productRevenues: RevenueEntity[];
}
