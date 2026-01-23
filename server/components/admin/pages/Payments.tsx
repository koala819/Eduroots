'use client'

import { Search, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { FamilyFeesSection } from '@/client/components/admin/molecules/FamilyFeesSection'
import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader } from '@/client/components/ui/card'
import { Input } from '@/client/components/ui/input'
import { useAuth } from '@/client/hooks/use-auth'
import { useToast } from '@/client/hooks/use-toast'
import { getFamilyProfileSummaryByStudentId } from '@/server/actions/api/family'
import { FamilyProfileSummary } from '@/types/family-payload'
import { StudentResponse } from '@/types/student-payload'
import { UserRoleEnum } from '@/types/user'

interface PaymentsViewProps {
  students: StudentResponse[]
}

export function PaymentsView({ students }: Readonly<PaymentsViewProps>) {
  const { toast } = useToast()
  const { session } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id ?? null,
  )
  const [familySummary, setFamilySummary] = useState<FamilyProfileSummary | null>(null)
  const [isLoadingFamily, setIsLoadingFamily] = useState(false)

  const canEdit = session?.user?.user_metadata?.role === UserRoleEnum.Admin ||
    session?.user?.user_metadata?.role === UserRoleEnum.Bureau

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return students
    return students.filter((student) => (
      `${student.firstname} ${student.lastname}`.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    ))
  }, [students, searchQuery])

  const loadFamilySummary = useCallback(async () => {
    if (!selectedStudentId) {
      setFamilySummary(null)
      return
    }

    setIsLoadingFamily(true)
    try {
      const response = await getFamilyProfileSummaryByStudentId(selectedStudentId)
      if (response.success && response.data) {
        setFamilySummary(response.data)
      } else {
        setFamilySummary(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos famille:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les informations de paiement',
        variant: 'destructive',
      })
      setFamilySummary(null)
    } finally {
      setIsLoadingFamily(false)
    }
  }, [selectedStudentId, toast])

  useEffect(() => {
    loadFamilySummary()
  }, [loadFamilySummary])

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  )

  return (
    <div className="bg-background p-3 md:p-4 lg:p-6 pb-8 sm:pb-0">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <Card className="rounded-2xl border border-border/50 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
              <div className="lg:w-1/3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4
                  text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un élève..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredStudents.map((student) => {
                    const isSelected = student.id === selectedStudentId
                    return (
                      <Button
                        key={student.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="w-full justify-start hover:bg-muted hover:text-primary"
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">
                            {student.firstname} {student.lastname}
                          </span>
                          <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>
                            {student.email || 'Email non renseigné'}
                          </span>
                        </div>
                      </Button>
                    )
                  })}

                  {filteredStudents.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">
                      Aucun élève trouvé
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <Card className="border border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {selectedStudent
                        ? `Fiche élève — ${selectedStudent.firstname} ${selectedStudent.lastname}`
                        : 'Aucun élève sélectionné'}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedStudentId ? (
                      <FamilyFeesSection
                        familySummary={familySummary}
                        isLoading={isLoadingFamily}
                        onReload={loadFamilySummary}
                        canEdit={canEdit}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Sélectionne un élève pour gérer ses paiements.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
