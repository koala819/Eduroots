'use client'

import { CreditCard, Receipt } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { FeePaymentStatus, FeeWithPayments } from '@/types/fees-payload'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

function getStatusLabel(status: FeePaymentStatus) {
  switch (status) {
  case 'paid':
    return 'Payée'
  case 'partial':
    return 'Partielle'
  default:
    return 'Impayée'
  }
}

function getFeeTypeLabel(type: string) {
  return type === 'membership' ? 'Cotisation' : 'Inscription'
}

interface FamilyFeesSummaryProps {
  fees: FeeWithPayments[]
}

export const FamilyFeesSummary = ({ fees }: FamilyFeesSummaryProps) => {
  if (!fees || fees.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">
            Cotisations & paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucune cotisation enregistrée.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cotisations & paiements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fees.map((fee) => (
          <div key={fee.id} className="border border-border rounded-md p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">
                  {getFeeTypeLabel(fee.fee_type)} {fee.academic_year}
                </p>
                <p className="text-sm text-muted-foreground">
                  Montant dû : {currencyFormatter.format(fee.amount_due)}
                </p>
              </div>
              <div className="text-sm">
                <span
                  className={`px-2 py-1 rounded-full border ${
                    fee.payment_status === 'paid'
                      ? 'bg-success/10 text-success border-success/20'
                      : fee.payment_status === 'partial'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-muted/10 text-muted-foreground border-muted/20'
                  }`}
                >
                  {getStatusLabel(fee.payment_status)}
                </span>
                <div className="text-muted-foreground mt-1">
                  Payé : {currencyFormatter.format(fee.paid_total)}
                </div>
              </div>
            </div>

            {fee.payments.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Paiements
                </div>
                <div className="space-y-2">
                  {fee.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between text-sm bg-muted/20
                      rounded-md px-3 py-2"
                    >
                      <span className="text-muted-foreground">
                        {new Date(payment.paid_at).toLocaleDateString('fr-FR')} • {payment.method}
                      </span>
                      <span className="font-medium text-foreground">
                        {currencyFormatter.format(payment.amount_paid)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
