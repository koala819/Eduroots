import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Fonction pour formater la distance par rapport à maintenant
export function formatTimeToNow(date: Date | null): string {
  if (!date) return 'Jamais'

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Convertir la différence en jours
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Aujourd\'hui'
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`
  return `Il y a ${Math.floor(days / 365)} ans`
}

// Récupérer la dernière absence
export function getLastAbsence(absences: Array<{ date: Date }>) {
  if (absences.length === 0) return null
  return absences[absences.length - 1].date
}

// Formater une date pour l'affichage
export function formatAbsenceDate(date: Date): string {
  return format(date, 'dd MMM yyyy', { locale: fr })
}

// Formater une date complète pour l'affichage
export function formatFullAbsenceDate(date: Date): string {
  return format(date, 'EEEE dd MMMM yyyy', { locale: fr })
}
