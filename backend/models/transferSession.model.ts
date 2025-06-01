import { Document, Schema, model, models } from 'mongoose'

interface SessionTransferDocumentNEW extends Document {
  fromTeacher: Schema.Types.ObjectId
  toTeacher: Schema.Types.ObjectId
  session: Schema.Types.ObjectId
  transferDate: Date
  restoredDate?: Date
  reason?: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  duration?: {
    startDate: Date
    endDate?: Date
  }
}

const sessionTransferSchemaNEW = new Schema<SessionTransferDocumentNEW>({
  fromTeacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toTeacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  transferDate: {
    type: Date,
    default: Date.now,
  },
  restoredDate: {
    type: Date,
    default: null,
  },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending',
  },
  duration: {
    startDate: { type: Date },
    endDate: { type: Date },
  },
})

// Indexes
sessionTransferSchemaNEW.index({ fromTeacher: 1, toTeacher: 1 })
sessionTransferSchemaNEW.index({ status: 1, transferDate: 1 })
sessionTransferSchemaNEW.index({
  'duration.startDate': 1,
  'duration.endDate': 1,
})

export const SessionTransferNEW =
  models?.SessionTransferNEW ||
  model<SessionTransferDocumentNEW>('SessionTransfer', sessionTransferSchemaNEW)
