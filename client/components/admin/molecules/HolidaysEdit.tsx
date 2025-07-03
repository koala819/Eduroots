'use client'

import { useState } from 'react'

import { Button } from '@/client/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { useToast } from '@/client/hooks/use-toast'
import {
  createHoliday,
  deleteHoliday,
  updateHoliday,
} from '@/server/actions/api/holidays'
import { Holiday } from '@/types/holidays'

interface HolidaysEditProps {
  holidays: Holiday[]
}

export default function HolidaysEdit({ holidays: initialHolidays }: HolidaysEditProps) {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    type: 'REGULAR' as 'REGULAR' | 'SPECIAL',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const resetForm = () => {
    setEditing(null)
    setForm({ name: '', start_date: '', end_date: '', type: 'REGULAR' })
  }

  const handleEdit = (holiday: Holiday) => {
    setEditing(holiday)
    setForm({
      name: holiday.name,
      start_date: holiday.start_date instanceof Date
        ? holiday.start_date.toISOString().slice(0, 10)
        : new Date(holiday.start_date).toISOString().slice(0, 10),
      end_date: holiday.end_date instanceof Date
        ? holiday.end_date.toISOString().slice(0, 10)
        : new Date(holiday.end_date).toISOString().slice(0, 10),
      type: holiday.type,
    })
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer cette date ?',
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)
    try {
      await deleteHoliday(id)
      setHolidays((prev) => prev.filter((h) => h.id !== id))
      resetForm()
      toast({
        title: 'Date supprimée avec succès',
        variant: 'success',
        description: 'Seul l\'admin peut le restaurer',
        duration: 3000 })
    } catch (e) {
      setError('Erreur lors de la suppression')
      toast({
        title: 'Erreur lors de la suppression de la date',
        variant: 'destructive',
        description: `Error (${e})`,
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation des dates
    const startDate = new Date(form.start_date)
    const endDate = new Date(form.end_date)

    if (endDate < startDate) {
      setError('La date de fin doit être supérieure ou égale à la date de début')
      toast({
        title: 'Erreur de validation',
        variant: 'destructive',
        description: 'La date de fin doit être supérieure ou égale à la date de début',
        duration: 3000,
      })
      setLoading(false)
      return
    }

    try {
      if (editing) {
        // Mode modification
        const { data, error } = await updateHoliday(editing.id, {
          name: form.name,
          start_date: form.start_date,
          end_date: form.end_date,
          type: form.type,
        })

        if (data) {
          setHolidays((prev) => prev.map((h) =>
            h.id === editing.id
              ? {
                ...data,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
              }
              : h,
          ))
          toast({
            title: 'Date modifiée avec succès',
            variant: 'success',
            description: '',
            duration: 3000,
          })
        } else if (error) {
          toast({
            title: 'Erreur lors de la modification',
            variant: 'destructive',
            description: `Erreur: ${typeof error === 'object' ? JSON.stringify(error) : error}`,
            duration: 3000,
          })
        }
      } else {
        // Mode création
        const { data, error } = await createHoliday({
          name: form.name,
          start_date: form.start_date,
          end_date: form.end_date,
          type: form.type,
        })

        if (data) {
          setHolidays((prev) => [
            ...prev,
            {
              ...data,
              start_date: new Date(data.start_date),
              end_date: new Date(data.end_date),
            },
          ].sort(
            (a, b) =>
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
          ))
          toast({
            title: 'Date créée avec succès',
            variant: 'success',
            description: '',
            duration: 3000,
          })
        } else if (error) {
          console.log('error', error)
          toast({
            title: 'Erreur lors de la création',
            variant: 'destructive',
            description: `Erreur: ${typeof error === 'object' ? JSON.stringify(error) : error}`,
            duration: 3000,
          })
        }
      }
      resetForm()
    } catch (e) {
      setError('Erreur lors de la sauvegarde')
      toast({
        title: 'Erreur lors de la sauvegarde',
        variant: 'destructive',
        description: `Erreur: ${e instanceof Error ? e.message : String(e)}`,
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 card">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-primary mb-2">
            {editing ? 'Modifier une vacance' : 'Ajouter une vacance'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="input w-full"
            placeholder="Nom"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            maxLength={100}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={form.type}
                onValueChange={(value: 'REGULAR' | 'SPECIAL') =>
                  setForm((f) => ({ ...f, type: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Vacances régulières</SelectItem>
                  <SelectItem value="SPECIAL">Événement spécial</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground mt-1">Type de vacance</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className="input w-full"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">Date de début</div>
            </div>
            <div className="flex-1">
              <input
                className="input w-full"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">Date de fin</div>
            </div>
          </div>
          {/* Message de validation en temps réel */}
          {(() => {
            const hasInvalidDates = form.start_date && form.end_date &&
              form.start_date !== '' && form.end_date !== '' &&
              new Date(form.end_date) < new Date(form.start_date)
            const sameDates = form.start_date && form.end_date &&
              form.start_date !== '' && form.end_date !== '' &&
              form.start_date === form.end_date

            if (hasInvalidDates) {
              return (
                <div className="text-xs" style={{ color: 'var(--color-error)' }}>
                  ⚠️ La date de fin doit être supérieure ou égale à la date de début
                </div>
              )
            }

            if (sameDates && form.type === 'REGULAR') {
              return (
                <div className="text-xs" style={{ color: 'var(--color-warning)' }}>
                  ℹ️ Même date de début et fin - Considérez le type "Événement spécial"
                </div>
              )
            }

            if (sameDates && form.type === 'SPECIAL') {
              return (
                <div className="text-xs" style={{ color: 'var(--color-success)' }}>
                  ✓ Événement d'une journée
                </div>
              )
            }

            return null
          })()}
          <div className="flex gap-2 mt-2">
            {(() => {
              const hasInvalidDates = Boolean(
                form.start_date && form.end_date &&
                form.start_date !== '' && form.end_date !== '' &&
                new Date(form.end_date) < new Date(form.start_date),
              )
              return (
                <Button
                  type="submit"
                  disabled={loading || hasInvalidDates}
                >
                  {editing ? 'Enregistrer' : 'Ajouter'}
                </Button>
              )
            })()}
            {editing && (
              <Button
                variant="secondary"
                type="button"
                onClick={resetForm}
                disabled={loading}
              >
                Annuler
              </Button>
            )}
          </div>
          {error && <div className="text-error text-sm mt-2">{error}</div>}
        </form>
      </div>
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary">Vacances existantes</h2>
        </div>
        <ul className="space-y-2">
          {holidays.map((holiday) => (
            <li
              key={holiday.id}
              className="flex items-center gap-2 border-b pb-2 last:border-b-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-foreground">{holiday.name}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    holiday.type === 'SPECIAL'
                      ? 'text-warning-foreground'
                      : 'text-info-foreground'
                  }`} style={{
                    backgroundColor: holiday.type === 'SPECIAL'
                      ? 'var(--color-warning)'
                      : 'var(--color-info)',
                  }}>
                    {holiday.type === 'SPECIAL' ? 'Spécial' : 'Vacances'}
                  </span>
                </div>
                <div className="text-xs">
                  {new Date(holiday.start_date).toLocaleDateString()} -
                  {new Date(holiday.end_date).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleEdit(holiday)}
                disabled={loading}
              >
                Modifier
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(holiday.id)}
                disabled={loading}
              >
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
