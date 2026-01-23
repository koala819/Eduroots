'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { getPaymentStatus } from '@/server/utils/fees'
import { ApiResponse } from '@/types/api'
import { FeePayment } from '@/types/db'
import {
  CreateFeePayload,
  CreateFeePaymentPayload,
  FeeWithPayments,
  UpdateFeePayload,
  UpdateFeePaymentPayload,
} from '@/types/fees-payload'
import { FeeWithPaymentsAndNotes } from '@/types/family-payload'
import { UserRoleEnum } from '@/types/user'

function toFeeWithPayments(
  fee: Omit<FeeWithPayments, 'payments' | 'paid_total' | 'payment_status'>,
  payments: FeePayment[],
): FeeWithPayments {
  const normalizedPayments = payments.map((payment) => ({
    ...payment,
    amount_paid: Number(payment.amount_paid ?? 0),
  }))
  const amountDue = Number(fee.amount_due ?? 0)
  const paidTotal = normalizedPayments.reduce((total, payment) => total + payment.amount_paid, 0)

  return {
    ...fee,
    amount_due: amountDue,
    payments: normalizedPayments,
    paid_total: paidTotal,
    payment_status: getPaymentStatus(amountDue, normalizedPayments.map((p) => p.amount_paid)),
  }
}

function toFeeWithPaymentsAndNotes(
  fee: Omit<FeeWithPaymentsAndNotes, 'payments' | 'notes' | 'paid_total' | 'payment_status'>,
  payments: FeePayment[],
  notes: FeeWithPaymentsAndNotes['notes'],
): FeeWithPaymentsAndNotes {
  const normalizedPayments = payments.map((payment) => ({
    ...payment,
    amount_paid: Number(payment.amount_paid ?? 0),
  }))
  const amountDue = Number(fee.amount_due ?? 0)
  const paidTotal = normalizedPayments.reduce((total, payment) => total + payment.amount_paid, 0)

  return {
    ...fee,
    amount_due: amountDue,
    payments: normalizedPayments,
    notes: notes ?? [],
    paid_total: paidTotal,
    payment_status: getPaymentStatus(amountDue, normalizedPayments.map((p) => p.amount_paid)),
  }
}

export async function getFeesByFamilyId(
  familyId: string,
  academicYear?: string,
): Promise<ApiResponse<FeeWithPayments[]>> {
  const authUser = await getAuthenticatedUser()
  const { supabase } = await getSessionServer()
  const isAdminOrBureau = authUser.user_metadata?.role === UserRoleEnum.Admin ||
    authUser.user_metadata?.role === UserRoleEnum.Bureau
  const adminSupabase = isAdminOrBureau
    ? createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
    : null
  const db = adminSupabase ?? supabase

  try {
    if (!familyId) {
      return { success: false, message: 'Id famille manquant', data: null }
    }

    let query = db
      .schema('education')
      .from('fees')
      .select('*, fee_payments(*)')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }

    const { data: fees, error } = await query

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      return { success: false, message: 'Erreur lors de la récupération des cotisations', data: null }
    }

    const feesWithPayments = (fees ?? []).map((fee: any) => {
      const payments = (fee.fee_payments ?? []) as FeePayment[]
      const { fee_payments: _, ...feeData } = fee
      return toFeeWithPayments(feeData, payments)
    })

    return {
      success: true,
      data: feesWithPayments,
      message: 'Cotisations récupérées avec succès',
    }
  } catch (error) {
    console.error('[GET_FEES_BY_FAMILY_ID]', error)
    throw new Error('Erreur lors de la récupération des cotisations')
  }
}

export async function getFeesWithNotesByFamilyId(
  familyId: string,
  academicYear?: string,
): Promise<ApiResponse<FeeWithPaymentsAndNotes[]>> {
  const authUser = await getAuthenticatedUser()
  const { supabase } = await getSessionServer()
  const isAdminOrBureau = authUser.user_metadata?.role === UserRoleEnum.Admin ||
    authUser.user_metadata?.role === UserRoleEnum.Bureau
  const adminSupabase = isAdminOrBureau
    ? createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
    : null
  const db = adminSupabase ?? supabase

  try {
    if (!familyId) {
      return { success: false, message: 'Id famille manquant', data: null }
    }

    let query = db
      .schema('education')
      .from('fees')
      .select('*, fee_payments(*), fee_notes(*)')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }

    const { data: fees, error } = await query

    if (error) {
      console.error('❌ Erreur Supabase lors de la récupération des fees:', error)
      console.error('❌ Code:', error.code, 'Message:', error.message, 'Details:', error.details)
      console.error('❌ Family ID:', familyId, 'Academic Year:', academicYear)
      return { success: false, message: 'Erreur lors de la récupération des cotisations', data: null }
    }

    const feesWithNotes = (fees ?? []).map((fee: any) => {
      const payments = (fee.fee_payments ?? []) as FeePayment[]
      const notes = (fee.fee_notes ?? []) as FeeWithPaymentsAndNotes['notes']
      const { fee_payments: _, fee_notes: __, ...feeData } = fee
      return toFeeWithPaymentsAndNotes(feeData, payments, notes)
    })

    return {
      success: true,
      data: feesWithNotes,
      message: 'Cotisations récupérées avec succès',
    }
  } catch (error) {
    console.error('[GET_FEES_WITH_NOTES_BY_FAMILY_ID]', error)
    throw new Error('Erreur lors de la récupération des cotisations')
  }
}

export async function getFeesByStudentId(
  studentId: string,
  academicYear?: string,
): Promise<ApiResponse<FeeWithPayments[]>> {
  const authUser = await getAuthenticatedUser()
  const { supabase } = await getSessionServer()
  const isAdminOrBureau = authUser.user_metadata?.role === UserRoleEnum.Admin ||
    authUser.user_metadata?.role === UserRoleEnum.Bureau
  const adminSupabase = isAdminOrBureau
    ? createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
    : null
  const db = adminSupabase ?? supabase

  try {
    if (!studentId) {
      return { success: false, message: 'Id étudiant manquant', data: null }
    }

    let query = db
      .schema('education')
      .from('fees')
      .select('*, fee_payments(*)')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }

    const { data: fees, error } = await query

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      return { success: false, message: 'Erreur lors de la récupération des cotisations', data: null }
    }

    const feesWithPayments = (fees ?? []).map((fee: any) => {
      const payments = (fee.fee_payments ?? []) as FeePayment[]
      const { fee_payments: _, ...feeData } = fee
      return toFeeWithPayments(feeData, payments)
    })

    return {
      success: true,
      data: feesWithPayments,
      message: 'Cotisations récupérées avec succès',
    }
  } catch (error) {
    console.error('[GET_FEES_BY_STUDENT_ID]', error)
    throw new Error('Erreur lors de la récupération des cotisations')
  }
}

export async function getFamilyFeesForUser(
  academicYear?: string,
): Promise<ApiResponse<FeeWithPayments[]>> {
  const user = await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: mainUser, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('id, family_id')
      .or(
        `auth_id_email.eq.${user.id},auth_id_gmail.eq.${user.id},` +
        `parent2_auth_id_email.eq.${user.id},parent2_auth_id_gmail.eq.${user.id}`,
      )
      .eq('is_active', true)
      .limit(1)

    if (userError || !mainUser || mainUser.length === 0) {
      return {
        success: false,
        message: 'Utilisateur principal non trouvé',
        data: null,
      }
    }

    const familyId = mainUser[0].family_id
    if (!familyId) {
      return {
        success: false,
        message: 'Famille non renseignée pour cet utilisateur',
        data: null,
      }
    }

    return await getFeesByFamilyId(familyId, academicYear)
  } catch (error) {
    console.error('[GET_FAMILY_FEES_FOR_USER]', error)
    throw new Error('Erreur lors de la récupération des cotisations')
  }
}

export async function createFee(payload: CreateFeePayload): Promise<ApiResponse<{ id: string }>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: fee, error } = await supabase
      .schema('education')
      .from('fees')
      .insert({
        ...payload,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !fee) {
      return { success: false, message: 'Cotisation non créée', data: null }
    }

    return { success: true, message: 'Cotisation créée', data: { id: fee.id } }
  } catch (error) {
    console.error('[CREATE_FEE]', error)
    throw new Error('Erreur lors de la création de la cotisation')
  }
}

export async function updateFee(
  feeId: string,
  payload: UpdateFeePayload,
): Promise<ApiResponse<{ id: string }>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!feeId) {
      return { success: false, message: 'Id cotisation manquant', data: null }
    }

    const { data: fee, error } = await supabase
      .schema('education')
      .from('fees')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feeId)
      .select('id')
      .single()

    if (error || !fee) {
      return { success: false, message: 'Cotisation non mise à jour', data: null }
    }

    return { success: true, message: 'Cotisation mise à jour', data: { id: fee.id } }
  } catch (error) {
    console.error('[UPDATE_FEE]', error)
    throw new Error('Erreur lors de la mise à jour de la cotisation')
  }
}

export async function createFeePayment(
  payload: CreateFeePaymentPayload,
): Promise<ApiResponse<{ id: string }>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: payment, error } = await supabase
      .schema('education')
      .from('fee_payments')
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !payment) {
      return { success: false, message: 'Paiement non créé', data: null }
    }

    return { success: true, message: 'Paiement créé', data: { id: payment.id } }
  } catch (error) {
    console.error('[CREATE_FEE_PAYMENT]', error)
    throw new Error('Erreur lors de la création du paiement')
  }
}

export async function updateFeePayment(
  paymentId: string,
  payload: UpdateFeePaymentPayload,
): Promise<ApiResponse<{ id: string }>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!paymentId) {
      return { success: false, message: 'Id paiement manquant', data: null }
    }

    const { data: payment, error } = await supabase
      .schema('education')
      .from('fee_payments')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select('id')
      .single()

    if (error || !payment) {
      return { success: false, message: 'Paiement non mis à jour', data: null }
    }

    return { success: true, message: 'Paiement mis à jour', data: { id: payment.id } }
  } catch (error) {
    console.error('[UPDATE_FEE_PAYMENT]', error)
    throw new Error('Erreur lors de la mise à jour du paiement')
  }
}
