import { Suspense } from 'react'

import { GenderEnum, UserType } from '@/types/user'

import { UserDetailsClient } from '@/client/components/admin/atoms/UserDetails'
import Loading from '@/server/components/admin/atoms/Loading'
import { StudentAttendanceStats } from '@/server/components/admin/atoms/StudentAttendanceStats'
import { StudentBehaviorStats } from '@/server/components/admin/atoms/StudentBehaviorStats'
import { TeacherStats } from '@/server/components/admin/atoms/TeacherStats'
import { StudentCourses } from '@/server/components/admin/molecules/StudentCourses'
import { Badge } from '@/client/components/ui/badge'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'
import { Button } from '@/client/components/ui/button'
import { CircleArrowLeft, Pencil } from 'lucide-react'

export const UserDetails = ({
  entity,
  onBack,
  onEdit,
}: Readonly<{
  entity: StudentResponse | TeacherResponse
  onBack: () => void
  onEdit: () => void
}>) => {
  if (entity.type === UserType.Student) {
    const student = entity as StudentResponse
    if (!student) {
      return <div>Error student not found</div>
    }
    return (
      <div className="space-y-4 pb-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onBack}>
            <CircleArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
        <UserDetailsClient
          gender={student.gender ?? GenderEnum.Masculin}
          dateOfBirth={student.date_of_birth ?? undefined}
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
    const teacher = entity as TeacherResponse

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onBack}>
            <CircleArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
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
          <TeacherStats teacherId={teacher.id} />
        </Suspense>
      </div>
    )
  }
}
