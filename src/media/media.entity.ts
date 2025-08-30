import { PgMainEntity } from 'src/main-classes/mainEntity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ProductEntity } from 'src/products/products.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';

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

  @OneToOne(() => ManagerEntity, (manager) => manager.profileImage)
  managers: ManagerEntity;

  @ManyToOne(() => ProductEntity, (product) => product.images)
  product: ProductEntity;

  @RelationId((media: MediaEntity) => media.product)
  productId: string | null;

  @OneToMany(() => MemberEntity, (member) => member.profileImage)
  members: MemberEntity[];
}
