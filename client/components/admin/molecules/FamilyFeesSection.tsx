'use client'

import { CreditCard, Receipt, StickyNote } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import { Input } from '@/client/components/ui/input'
import { Textarea } from '@/client/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { useToast } from '@/client/hooks/use-toast'
import {
  createFeeNote,
  createFeePayment,
  updateFeeNote,
} from '@/server/actions/api/fees'
import { FamilyProfileSummary } from '@/types/family-payload'
import { FeePaymentMethod } from '@/types/fees-payload'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

type PaymentFormState = {
  feeId: string
  amount_paid: string
  method: FeePaymentMethod
  paid_at: string
}

const paymentMethodLabels: Record<FeePaymentMethod, string> = {
  cheque: 'Chèque',
  liquide: 'Liquide',
  espece: 'Espèce',
  cb: 'Carte bancaire',
  helloasso: 'HelloAsso',
  exoneration: 'Exonération',
}

interface FamilyFeesSectionProps {
  familySummary: FamilyProfileSummary | null
  isLoading: boolean
  onReload: () => Promise<void> | void
  canEdit?: boolean
}

export function FamilyFeesSection({
  familySummary,
  isLoading,
  onReload,
  canEdit = false,
}: FamilyFeesSectionProps) {
  const { toast } = useToast()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState<PaymentFormState | null>(null)
  const [notesValue, setNotesValue] = useState('')

  const firstNote = useMemo(() => (
    familySummary?.fees?.flatMap((fee) => fee.notes)?.[0] ?? null
  ), [familySummary?.fees])
  const notesFeeId = firstNote?.fee_id ?? familySummary?.fees?.[0]?.id ?? null

  useEffect(() => {
    setNotesValue(firstNote?.note_text ?? '')
  }, [firstNote?.note_text])

  const openCreatePayment = (feeId: string) => {
    setPaymentForm({
      feeId,
      amount_paid: '',
      method: 'liquide',
      paid_at: new Date().toISOString().split('T')[0],
    })
    setPaymentDialogOpen(true)
  }

  const handleSaveNotesField = async () => {
    if (!notesFeeId) return

    try {
      if (firstNote?.id) {
        const response = await updateFeeNote(firstNote.id, {
          note_text: notesValue,
        })
        if (!response.success) {
          throw new Error(response.message || 'Impossible de modifier la note')
        }
      } else if (notesValue.trim()) {
        const response = await createFeeNote({
          fee_id: notesFeeId,
          note_text: notesValue,
        })
        if (!response.success) {
          throw new Error(response.message || 'Impossible d\'ajouter la note')
        }
      }

      toast({ title: 'Note enregistrée' })
      await onReload()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const handleSavePayment = async () => {
    if (!paymentForm) return
    const amount = Number(paymentForm.amount_paid || 0)
    const paidAt = new Date(paymentForm.paid_at)

    try {
      const response = await createFeePayment({
        fee_id: paymentForm.feeId,
        amount_paid: amount,
        method: paymentForm.method,
        paid_at: paidAt,
      })
      if (!response.success) {
        throw new Error(response.message || 'Impossible d\'ajouter le paiement')
      }
      toast({ title: 'Paiement ajouté' })
      setPaymentDialogOpen(false)
      setPaymentForm(null)
      await onReload()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-3">
      {familySummary?.family && (
        <Card className="border border-border rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Membres de la famille
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {familySummary.family.label}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground">Parents</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {familySummary.parents.map((parent) => (
                  <div key={parent.label} className="rounded-md border border-border/60 p-3">
                    <div className="text-sm font-medium text-foreground">
                      {parent.label === 'pere' ? 'Père' : 'Mère'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Email : {parent.email || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Téléphone : {parent.phone || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground">Enfants</div>
              {familySummary.siblings.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun enfant rattaché.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {familySummary.siblings.map((sibling) => (
                    <Badge key={sibling.id} variant="outline">
                      {sibling.firstname} {sibling.lastname}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CreditCard className="h-4 w-4" />
          Situation des paiements
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement des cotisations...</p>
      )}

      {!isLoading && !familySummary?.family && (
        <div className="rounded-md border border-warning/50 bg-warning/10 p-3">
          <p className="text-sm font-medium text-warning">
            ⚠️ Aucune famille assignée
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cet étudiant n'est pas rattaché à une famille. Les cotisations ne peuvent pas être
            affichées.
          </p>
        </div>
      )}

      {!isLoading && familySummary?.family &&
        (!familySummary?.fees || familySummary.fees.length === 0) && (
        <div className="rounded-md border border-border/50 bg-muted/20 p-3">
          <p className="text-sm font-medium text-foreground">
            Aucune cotisation enregistrée
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Aucune cotisation ou inscription n'a été enregistrée pour la famille
            "{familySummary.family.label}".
          </p>
        </div>
      )}

      {familySummary?.fees?.map((fee) => (
        <Card key={fee.id} className="border border-border rounded-md">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">
                  {fee.fee_type === 'membership' ? 'Cotisation' : 'Inscription'} {fee.academic_year}
                </p>
                {fee.payment_status !== 'paid' && (
                  <p className="text-sm text-muted-foreground">
                    Montant dû : {currencyFormatter.format(fee.amount_due)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {fee.payment_status === 'paid' ? (
                  <Badge className="bg-success/15 text-success border-success/30">
                    Payée
                  </Badge>
                ) : (
                  <Badge className="bg-error/15 text-error border-error/30">
                    Restant : {currencyFormatter.format(fee.amount_due - fee.paid_total)}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Paiements
              </div>
              {canEdit && fee.payment_status !== 'paid' && (
                <Button size="sm" variant="outline" onClick={() => openCreatePayment(fee.id)}>
                  Ajouter un paiement
                </Button>
              )}
            </div>

            {fee.payments.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
            )}

            {fee.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
                text-sm bg-muted/20 rounded-md px-3 py-2"
              >
                <span className="text-muted-foreground">
                  {new Date(payment.paid_at).toLocaleDateString('fr-FR')} • {payment.method}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {currencyFormatter.format(payment.amount_paid)}
                  </span>
                </div>
              </div>
            ))}

          </CardContent>
        </Card>
      ))}

      {!!familySummary?.fees?.length && (
        <Card className="border border-border rounded-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Saisir une note..."
              value={notesValue}
              onChange={(event) => setNotesValue(event.target.value)}
              disabled={!canEdit}
            />
            {firstNote?.created_at && (
              <div className="text-xs text-muted-foreground">
                Dernière sauvegarde : {new Date(firstNote.created_at).toLocaleString('fr-FR')}
              </div>
            )}
            {canEdit && (
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveNotesField}>
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajouter un paiement
            </DialogTitle>
          </DialogHeader>

          {paymentForm && (
            <div className="space-y-3">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Montant payé"
                value={paymentForm.amount_paid}
                onChange={(event) => setPaymentForm((prev) => prev
                  ? { ...prev, amount_paid: event.target.value }
                  : prev)}
              />
              <Select
                value={paymentForm.method}
                onValueChange={(value: FeePaymentMethod) => setPaymentForm((prev) => prev
                  ? { ...prev, method: value }
                  : prev)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={paymentForm.paid_at}
                onChange={(event) => setPaymentForm((prev) => prev
                  ? { ...prev, paid_at: event.target.value }
                  : prev)}
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleSavePayment}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
