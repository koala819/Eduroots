import { Schema } from 'mongoose'

export const rootOptions = {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}

export const rootSchema = new Schema(
  {
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  rootOptions,
)
