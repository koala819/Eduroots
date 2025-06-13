'use client'

import { Student } from '@/types/mongo/user'

interface StudentSelectorProps {
  familyStudents: Student[]
  selectedChildId: string | null | undefined
  onSelectStudent: (studentId: string) => void
}

export default function StudentSelector({
  familyStudents,
  selectedChildId,
  onSelectStudent,
}: StudentSelectorProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {familyStudents.map((child) => {
        return (
          <div
            key={child.id || child._id}
            className={'flex flex-col items-center cursor-pointer transition-all'}
            onClick={() => onSelectStudent(child._id)}
          >
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold
                mb-2 border-2 transition-all m-4
                ${ selectedChildId === child._id
            ? 'bg-sky-100 text-sky-500 border-sky-500 transform scale-105 shadow-lg'
            : 'bg-slate-200 text-slate-500 border-transparent'
          }`}
            >
              {child.firstname.charAt(0).toUpperCase()} {child.lastname.charAt(0).toUpperCase()}
            </div>
            <span
              className={`text-sm font-semibold ${
                selectedChildId === child._id ? 'text-sky-500' : 'text-slate-500'
              }`}
            >
              {child.firstname} {child.lastname}
            </span>
          </div>
        )
      })}
    </div>
  )
}
