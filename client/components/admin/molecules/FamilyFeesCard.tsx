'use client'

import { CreditCard, Receipt } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { FeeWithPayments } from '@/types/fees-payload'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

function getFeeTypeLabel(type: string) {
  return type === 'membership' ? 'Cotisation' : 'Inscription'
}

interface FamilyFeesCardProps {
  fees: FeeWithPayments[]
}

export const FamilyFeesCard = ({ fees }: FamilyFeesCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cotisations & paiements (famille)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!fees || fees.length === 0) && (
          <p className="text-sm text-muted-foreground">Aucune cotisation enregistrée.</p>
        )}

        {fees?.map((fee) => (
          <div key={fee.id} className="border border-border rounded-md p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">
                  {getFeeTypeLabel(fee.fee_type)} {fee.academic_year}
                </p>
                <p className="text-sm text-muted-foreground">
                  Dû : {currencyFormatter.format(fee.amount_due)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Payé : {currencyFormatter.format(fee.paid_total)}
              </div>
            </div>

            {fee.payments.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Paiements
                </div>
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
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
