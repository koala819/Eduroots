'use client'

import { CourseSessionWithRelations, SubjectNameEnum } from '@/types/courses'

export const TeacherCard = ({
  session,
  onClick,
}: Readonly<{session: CourseSessionWithRelations; onClick: () => void}>) => {
  const baseClasses = [
    'p-3 rounded-lg text-white cursor-pointer',
    'transition-transform hover:scale-[1.02] space-y-1',
  ].join(' ')
  const colorClasses = session.subject === SubjectNameEnum.Arabe ? 'bg-emerald-600' : 'bg-blue-600'

  const timeSlot = session.courses_sessions_timeslot[0]
  const teacher = session.courses_sessions_students[0]?.users

  const teacherName = teacher?.firstname && teacher?.lastname
    ? `${teacher.firstname} ${teacher.lastname.charAt(0)}.`
    : 'Enseignant non assigné'

  return (
    <button className={`${baseClasses} ${colorClasses}`} onClick={onClick}>
      <div className="font-medium truncate">{teacherName}</div>
      <div className="text-sm opacity-90">Salle {timeSlot?.classroom_number ?? 'N/A'}</div>
    </button>
  )
}
