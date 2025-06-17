'use client'

import { GraduationCap, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { StatsCards } from '@/client/components/admin/molecules/StatsCards'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'
import { UserRoleEnum } from '@/types/user'

interface SchoolPeopleClientProps {
  students: StudentResponse[]
  teachers: TeacherResponse[]
}

export function SchoolPeopleClient({
  students,
  teachers,
}: Readonly<SchoolPeopleClientProps>) {
  const [selectedType, setSelectedType] = useState<UserRoleEnum | null>(null)

  const people = useMemo(() => {
    return [
      {
        title: 'Total Élèves',
        value: students.length,
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-600',
        type: UserRoleEnum.Student,
        data: selectedType === UserRoleEnum.Student ? students : [],
      },
      {
        title: 'Total Professeurs',
        value: teachers.length,
        icon: GraduationCap,
        color: 'text-green-600',
        bgColor: 'bg-green-600',
        type: UserRoleEnum.Teacher,
        data: selectedType === UserRoleEnum.Teacher ? teachers : [],
      },
    ]
  }, [students, teachers, selectedType])

  return <StatsCards people={people} selectedType={selectedType} onSelectType={setSelectedType} />
}
