import { PgMainEntity } from 'src/main-classes/mainEntity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ProductEntity } from 'src/products/products.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@Entity('media')
export class MediaEntity extends PgMainEntity {
  @Column('text')
  s3Key: string;

  @Column('text')
  originalName: string;

  @Column('text', { nullable: true, default: null })
  fileName: string;

  @Column('int')
  size: number;

  @Column('text')
  mimeType: string;

  @ManyToOne(() => ManagerEntity, (manager) => manager.media)
  manager: ManagerEntity;

  @RelationId((media: MediaEntity) => media.manager)
  managerId: string | null;

  @ManyToOne(() => ProductEntity, (product) => product.images)
  product: ProductEntity;

  @RelationId((media: MediaEntity) => media.product)
  productId: string | null;
}
