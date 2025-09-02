import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MemberEntity } from '../../member/entities/member.entity';
import { ManagerEntity } from '../../manager/manager.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('ai_chat_conversations')
export class AiChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  memberId: string;

  @Column({ type: 'uuid', nullable: true })
  managerId: string;

  @ManyToOne(() => MemberEntity, { nullable: true })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @ManyToOne(() => ManagerEntity, { nullable: true })
  @JoinColumn({ name: 'managerId' })
  manager: ManagerEntity;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: MessageRole,
    default: MessageRole.USER,
  })
  role: MessageRole;

  @Column({ type: 'uuid', nullable: true })
  conversationId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
