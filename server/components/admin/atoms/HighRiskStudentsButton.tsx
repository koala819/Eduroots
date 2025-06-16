import { HighRiskStudentsButtonClient } from '@/client/components/admin/atoms/HighRiskStudentsButton'

export const HighRiskStudentsButton = ({ className }: {className?: string}) => {
  // Définir l'URL au niveau du serveur
  const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || ''
  const targetUrl = `${baseUrl}/admin/highRiskAbsenceStudents`

  return <HighRiskStudentsButtonClient className={className} targetUrl={targetUrl} />
}
