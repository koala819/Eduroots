import mongoose, {Document, Schema, Types} from 'mongoose'

export interface IConnectionLog extends Document {
  user: {
    _id: Types.ObjectId
    firstname: string
    lastname: string
    email: string
    role: string
  }
  isSuccessful: boolean
  timestamp: Date
  userAgent: string
}

const connectionLogSchema = new Schema({
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    firstname: {
      type: String,
      required: false,
    },
    lastname: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  isSuccessful: {
    type: Boolean,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
    required: true,
  },
})

export const ConnectionLog =
  mongoose.models.ConnectionLog ||
  mongoose.model<IConnectionLog>('ConnectionLog', connectionLogSchema)
