import { GymEntity } from 'src/gym/entities/gym.entity';
import { PgMainEntity } from 'src/main-classes/mainEntity';
import { Entity, Column, ManyToOne } from 'typeorm';

export enum TwilioMessageType {
  expiaryReminder = 'expiaryReminder',
  welcomeMessage = 'welcomeMessage',
  welcomeMessageCalisthenics = 'welcomeMessageCalisthenics',
  gymPaymentConfirmation = 'gymPaymentConfirmation',
  memberExpiredReminder = 'memberExpiredReminder',
}

export enum TwilioMessageDeliveryStatus {
  delivered = 'delivered',
  failed = 'failed',
  pending = 'pending',
  read = 'read',
}

@Entity('twilio_messages')
export class TwilioMessageEntity extends PgMainEntity {
  @Column('text', { nullable: true })
  message: string;

  @Column('text', { nullable: true })
  phoneNumber: string;

  @Column('text', { nullable: true })
  phoneNumberISOCode: string;

  @ManyToOne(() => GymEntity, (gym) => gym.twilioMessages, {
    onDelete: 'SET NULL',
  })
  gym: GymEntity;

  @Column('text', { nullable: false })
  messageType: TwilioMessageType;

  @Column('text', { nullable: true })
  messageSid: string;

  @Column('text', { nullable: true })
  twilioTemplate?: string;

  @Column('text', { nullable: true })
  sentBy?: string;

  @Column('text', { default: TwilioMessageDeliveryStatus.pending })
  deliveryStatus: TwilioMessageDeliveryStatus;

  @Column('text', { nullable: true })
  errorCode: string;
}
