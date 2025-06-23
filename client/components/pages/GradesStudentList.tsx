'use client'

import { ClipboardEdit, User } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Input } from '@/client/components/ui/input'
import { Label } from '@/client/components/ui/label'

type GradeEntry = {
  student: string
  value: number
  isAbsent: boolean
  comment: string
}

interface GradesStudentListProps {
  gradeEntries: GradeEntry[]
  selectedSession: string
  getStudentRecord: (studentId: string) => GradeEntry | undefined
  handleGradeUpdate: (
    studentId: string,
    field: 'value' | 'isAbsent' | 'comment',
    value: string | number | boolean,
  ) => void
}

export function GradesStudentList({
  gradeEntries,
  selectedSession,
  getStudentRecord,
  handleGradeUpdate,
}: GradesStudentListProps) {
  if (gradeEntries.length > 0) {
    return (
      <Card className="shadow-lg border-border bg-background
        hover:border-primary transition-all duration-200">
        <CardHeader className="pb-3 border-b border-border
          bg-primary/5">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            Notes des élèves
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {gradeEntries.map((student, index) => {
              const record = getStudentRecord(student.student)
              const isGraded = !record?.isAbsent && (record?.value || 0) > 0

              return (
                <div
                  key={student.student}
                  className="p-4 border border-border rounded-[--radius]
                    bg-input hover:border-primary
                    transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary
                        flex items-center justify-center text-primary-foreground
                        font-semibold text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {student.student}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Élève #{index + 1}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Note actuelle:
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        isGraded
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isGraded ? 'Noté' : 'Non noté'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm text-foreground font-medium min-w-20">
                        Note (/20):
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={record?.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          const numericValue = value === '' ? 0 : parseFloat(value)
                          handleGradeUpdate(
                            student.student,
                            'value',
                            numericValue,
                          )
                        }}
                        className="w-24 border-border bg-background
                          hover:border-primary focus:border-primary
                          focus:ring-ring transition-colors"
                        placeholder="0-20"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Label className="text-sm text-foreground font-medium min-w-20">
                        Commentaire:
                      </Label>
                      <Input
                        type="text"
                        value={record?.comment || ''}
                        onChange={(e) =>
                          handleGradeUpdate(
                            student.student,
                            'comment',
                            e.target.value,
                          )
                        }
                        className="flex-1 border-border bg-background
                          hover:border-primary focus:border-primary
                          focus:ring-ring transition-colors"
                        placeholder="Commentaire optionnel..."
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedSession) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-white to-slate-50/50
        rounded-lg border border-slate-200 shadow-sm mt-6">
        <div className="text-slate-400 mb-4">
          <ClipboardEdit className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Aucun élève dans cette classe
        </h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Cette session ne contient pas d&apos;élèves à noter.
        </p>
      </div>
    )
  }

  return null
}
