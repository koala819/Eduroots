import {Document, Schema, model, models} from 'mongoose'

interface SessionTransferDocument extends Document {
  fromTeacher: Schema.Types.ObjectId
  toTeacher: Schema.Types.ObjectId
  session: Schema.Types.ObjectId
  transferDate: Date
  restoredDate?: Date
}

const sessionTransferSchema = new Schema<SessionTransferDocument>({
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
    ref: 'User',
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
})

export const SessionTransfer =
  models?.SessionTransfer ||
  model<SessionTransferDocument>('SessionTransfer', sessionTransferSchema)
