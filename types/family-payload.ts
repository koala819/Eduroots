import { Family, FeeNote, FeePayment, Fee } from '@/types/db'
import { FeePaymentStatus } from '@/types/fees-payload'

export type ParentContact = {
  label: 'pere' | 'mere'
  email: string | null
  phone: string | null
  whatsapp: string | null
}

export type FamilyStudentContact = {
  id: string
  firstname: string
  lastname: string
  email: string | null
  secondary_email: string | null
  phone: string | null
  secondary_phone: string | null
  whatsapp_phone: string | null
}

export type FeeWithPaymentsAndNotes = Fee & {
  payments: FeePayment[]
  notes: FeeNote[]
  paid_total: number
  payment_status: FeePaymentStatus
}

export type FamilyProfileSummary = {
  family: Family | null
  siblings: FamilyStudentContact[]
  parents: ParentContact[]
  fees: FeeWithPaymentsAndNotes[]
}
