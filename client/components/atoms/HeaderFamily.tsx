'use client'

import { ChevronDown, Users } from 'lucide-react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { User } from '@/types/db'
import { UserRoleEnum } from '@/types/user'

interface HeaderFamilyProps {
  familyStudents: Array<User & { role: UserRoleEnum.Student }>
}

export const HeaderFamily = ({
  familyStudents,
}: HeaderFamilyProps) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(
    familyStudents.length > 0 ? familyStudents[0].id : null,
  )

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId)

    // Émettre un événement personnalisé pour notifier les composants qui écoutent
    const customEvent = new CustomEvent('headerFamilyStudentChanged', {
      detail: { studentId },
    })
    window.dispatchEvent(customEvent)
  }

  const getSelectedStudent = () => {
    return familyStudents.find((student) => student.id === selectedStudent)
  }

  const selectedStudentData = getSelectedStudent()

  return (
    <div className={'flex-[0.4] flex justify-end'}>
      {/* Sélecteur d'enfant - Design moderne avec badge */}
      {familyStudents && familyStudents.length > 0 && (
        <div className="w-full max-w-md">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full px-3 sm:px-4 py-2.5 rounded-xl
                bg-primary-foreground/10 border border-primary-foreground/20
                text-primary-foreground/90 hover:bg-primary-foreground/15
                hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Users className="w-4 h-4 text-primary-foreground/70 flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-sm font-medium truncate">
                      {selectedStudentData ?
                        `${selectedStudentData.firstname} ${selectedStudentData.lastname}`
                        : 'Sélectionner un enfant'}
                    </span>
                    <span className="text-xs bg-primary-foreground text-primary
                        px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {familyStudents.length} enfant{familyStudents.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                  {familyStudents.length}
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-full min-w-[280px] sm:min-w-[300px] p-2 bg-white
              border border-gray-200 shadow-lg">
              {familyStudents.map((student) => {

                return (
                  <DropdownMenuItem
                    key={student.id}
                    onClick={() => handleStudentChange(student.id)}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-sm
                      transition-all duration-200 flex items-center justify-between
                      group cursor-pointer text-foreground hover:bg-muted
                      hover:text-foreground"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-medium truncate">
                          {student.firstname} {student.lastname}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
