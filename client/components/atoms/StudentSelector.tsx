'use client'

import { User } from '@/types/db'
import { UserRoleEnum } from '@/types/user'

interface StudentSelectorProps {
  familyStudents: Array<User & { role: UserRoleEnum.Student }>
  selectedChildId: string | null | undefined
  onSelectStudent: (studentId: string) => void
}

export default function StudentSelector({
  familyStudents,
  selectedChildId,
  onSelectStudent,
}: Readonly<StudentSelectorProps>) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {familyStudents.map((child) => {
        return (
          <button
            key={child.id}
            className={'flex flex-col items-center cursor-pointer transition-all '+
              'border-none bg-transparent p-0'}
            onClick={() => onSelectStudent(child.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectStudent(child.id)
              }
            }}
            aria-pressed={selectedChildId === child.id}
            aria-label={`Sélectionner ${child.firstname} ${child.lastname}`}
          >
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold
                mb-2 border-2 transition-all m-4
                ${ selectedChildId === child.id
            ? 'bg-sky-100 text-sky-500 border-sky-500 transform scale-105 shadow-lg'
            : 'bg-slate-200 text-slate-500 border-transparent'
          }`}
            >
              {child.firstname.charAt(0).toUpperCase()} {child.lastname.charAt(0).toUpperCase()}
            </div>
            <span
              className={`text-sm font-semibold ${
                selectedChildId === child.id ? 'text-sky-500' : 'text-slate-500'
              }`}
            >
              {child.firstname} {child.lastname}
            </span>
          </button>
        )
      })}
    </div>
  )
}
