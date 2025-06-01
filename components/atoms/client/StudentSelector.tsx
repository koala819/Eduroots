'use client'

import { FamilyChildren } from '@/types/messages'
import { Student } from '@/types/user'

interface StudentSelectorProps {
  familyChildrenFromChat?: FamilyChildren[]
  familyChildrenFromHome?: Student[]
  selectedChildId: string | null | undefined
  onSelectStudent: (studentId: string) => void
}

export default function StudentSelector({
  familyChildrenFromChat,
  familyChildrenFromHome,
  selectedChildId,
  onSelectStudent,
}: StudentSelectorProps) {

  const children = familyChildrenFromChat || familyChildrenFromHome

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {children?.map((child) => {
        const isHomepageStudent = 'lastname' in child

        return (
          <div
            key={child.id}
            className={'flex flex-col items-center cursor-pointer transition-all'}
            onClick={() => onSelectStudent(child.id)}
          >
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl
                 font-bold mb-2 border-2 transition-all m-4
                 ${selectedChildId === child.id
            ? 'bg-sky-100 text-sky-500 border-sky-500 transform scale-105 shadow-lg'
            : 'bg-slate-200 text-slate-500 border-transparent'
          }`}
            >
              {child.firstname.charAt(0).toUpperCase()}
              {isHomepageStudent
                ? (child as Student).lastname.charAt(0).toUpperCase()
                : (child as FamilyChildren).name.charAt(0).toUpperCase()}
            </div>
            <span
              className={`text-sm font-semibold ${
                selectedChildId === child.id ? 'text-sky-500' : 'text-slate-500'
              }`}
            >
              {child.firstname} {isHomepageStudent
                ? (child as Student).lastname : (child as FamilyChildren).name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
