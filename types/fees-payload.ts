import { Fee, FeePayment } from '@/types/db'

export type FeePaymentStatus = 'unpaid' | 'partial' | 'paid'

export type FeePaymentMethod =
  'cheque' |
  'liquide' |
  'espece' |
  'cb' |
  'helloasso' |
  'exoneration'

export type FeeWithPayments = Fee & {
  payments: FeePayment[]
  paid_total: number
  payment_status: FeePaymentStatus
}

export type CreateFeePayload = Omit<Fee,
  'id' |
  'created_at' |
  'updated_at' |
  'deleted_at' |
  'is_active'>

export type UpdateFeePayload = Partial<Omit<Fee,
  'id' |
  'family_id' |
  'created_at' |
  'updated_at' |
  'deleted_at'>>

export type CreateFeePaymentPayload = Omit<FeePayment,
  'id' |
  'created_at' |
  'updated_at'>

export type UpdateFeePaymentPayload = Partial<Omit<FeePayment,
  'id' |
  'fee_id' |
  'created_at' |
  'updated_at'>>

export type CreateFeeNotePayload = {
  fee_id: string
  note_text: string
}

export type UpdateFeeNotePayload = Partial<Omit<CreateFeeNotePayload, 'fee_id'>>
