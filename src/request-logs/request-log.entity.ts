import { PgMainEntity } from 'src/main-classes/mainEntity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('request_logs')
export class RequestLogEntity extends PgMainEntity {
  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  durationMs: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  deviceId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  headers: string | null; // JSON string

  @Column({ type: 'text', nullable: true })
  requestBody: string | null; // JSON string (truncated)

  @Column({ type: 'text', nullable: true })
  queryParams: string | null; // JSON string

  @Column({ type: 'text', nullable: true })
  routeParams: string | null; // JSON string

  @Column({ type: 'boolean', default: false })
  isError: boolean;

  @Column({ type: 'boolean', default: false })
  isSlow: boolean;
}
