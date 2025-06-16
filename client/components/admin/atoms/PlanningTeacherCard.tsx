'use client'

import { CourseSession, SubjectNameEnum } from '@/zUnused/types/course'

export const TeacherCard = ({ session, onClick }: {session: CourseSession; onClick: () => void}) => {
  const baseClasses =
    'p-3 rounded-lg text-white cursor-pointer transition-transform hover:scale-[1.02] space-y-1'
  const colorClasses = session.subject === SubjectNameEnum.Arabe ? 'bg-emerald-600' : 'bg-blue-600'

  const teacherName =
    session.user?.firstname && session.user?.lastname
      ? `${session.user.firstname} ${session.user.lastname.charAt(0)}.`
      : 'Enseignant non assigné'

  return (
    <div className={`${baseClasses} ${colorClasses}`} onClick={onClick}>
      <div className="font-medium truncate">{teacherName}</div>
      <div className="text-sm opacity-90">Salle {session.timeSlot.classroomNumber}</div>
    </div>
  )
}
