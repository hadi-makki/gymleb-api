import { SchemaOptions } from '@nestjs/mongoose';

import { Schema } from '@nestjs/mongoose';

export function CustomSchema(options: SchemaOptions = {}) {
  return Schema({
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    ...options,
  });
}
