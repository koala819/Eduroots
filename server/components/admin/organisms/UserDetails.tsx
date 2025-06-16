import { Suspense } from 'react'

import { GenderEnum, UserRoleEnum } from '@/types/user'

import { UserDetailsClient } from '@/client/components/admin/atoms/UserDetails'
import Loading from '@/server/components/admin/atoms/Loading'
import { StudentAttendanceStats } from '@/server/components/admin/atoms/StudentAttendanceStats'
import { StudentBehaviorStats } from '@/client/components/admin/atoms/StudentBehaviorStats'
import { TeacherStatsServer } from '@/client/components/admin/atoms/TeacherStats'
import { StudentCourses } from '@/server/components/admin/molecules/StudentCourses'
import { Badge } from '@/client/components/ui/badge'
import { Student, Teacher } from '@/zUnused/mongo/user'

export const UserDetails = ({ entity }: { entity: Student | Teacher }) => {
  if (entity.role === UserRoleEnum.Student) {
    const student = entity as Student
    if (!student) {
      return <div>Error student not found</div>
    }
    return (
      <div className="space-y-4 pb-4">
        <UserDetailsClient
          gender={student.gender ?? GenderEnum.Masculin}
          dateOfBirth={student.dateOfBirth}
        />
        <Suspense fallback={<Loading name="cours des étudiants" />}>
          <StudentCourses studentId={student.id} />
        </Suspense>
        <Suspense fallback={<Loading name="statistiques des absences" />}>
          <StudentAttendanceStats studentId={student.id} />
        </Suspense>
        <Suspense fallback={<Loading name="statistiques des comportements" />}>
          <StudentBehaviorStats studentId={student.id} />
        </Suspense>
      </div>
    )
  } else {
    const teacher = entity as Teacher

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-500">Email</h4>
            <p>{teacher.email}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-500 mb-2">
            Matières enseignées
          </h4>
          <div className="flex flex-wrap gap-2">
            {teacher.subjects?.map((subject) => (
              <Badge key={subject} variant="secondary">
                {subject}
              </Badge>
            )) || 'Aucune matière spécifiée'}
          </div>
        </div>

        <Suspense fallback={<Loading name="statistiques de l'enseignant" />}>
          <TeacherStatsServer teacherId={teacher.id} />
        </Suspense>
      </div>
    )
  }
}
