'use client'
import { PersonalCardInfo } from '@/client/components/admin/atoms/StudentCardPersonal'
import { FamilyFeesCard } from '@/client/components/admin/molecules/FamilyFeesCard'
import { CoursesCardInfo } from '@/client/components/admin/molecules/StudentCardCourses'
import { StudentCourseSession } from '@/types/courses'
import { FeeWithPayments } from '@/types/fees-payload'
import { StudentResponse } from '@/types/student-payload'

interface StudentEditProps {
  id: string
  studentPersonalData: StudentResponse
  studentCoursesData: StudentCourseSession[]
  familyFees: FeeWithPayments[]
}

export const StudentEdit = ({
  id,
  studentPersonalData,
  studentCoursesData,
  familyFees,
}: StudentEditProps) => {

  return (
    <div className="bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

        {/* Contenu principal */}
        <div className="space-y-4 md:space-y-6">
          <PersonalCardInfo id={id} data={studentPersonalData} />
          <CoursesCardInfo studentId={id} data={studentCoursesData} />
          <FamilyFeesCard fees={familyFees} />
        </div>
      </div>
    </div>
  )
}
