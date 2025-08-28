import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';

@CustomSchema()
export class OwnerSubscriptionType extends MainEntity {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, required: true, min: 1 })
  durationDays: number;

  @Prop({ type: String, required: false })
  description?: string;
}

export const OwnerSubscriptionTypeSchema = SchemaFactory.createForClass(
  OwnerSubscriptionType,
);
