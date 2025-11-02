import { Column, Entity } from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';

export enum Platform {
  WINDOWS = 'windows',
  LINUX = 'linux',
}

@Entity('app_versions')
export class AppVersionEntity extends PgMainEntity {
  @Column({
    type: 'enum',
    enum: Platform,
  })
  platform: Platform;

  @Column('text')
  version: string;

  @Column('text', { nullable: true })
  releaseNotes: string;

  @Column('text')
  fileUrl: string;

  @Column('text')
  s3Key: string;

  @Column('bigint')
  fileSize: number;

  @Column('text')
  checksum: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  releasedAt: Date;

  @Column('int', { default: 0 })
  downloadCount: number;
}
