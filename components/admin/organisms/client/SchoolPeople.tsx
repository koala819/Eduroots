'use client'

import {GraduationCap, Users} from 'lucide-react'
import {useMemo, useState} from 'react'

import {EntityType} from '@/types/stats'
import {Student, Teacher} from '@/types/user'

import {StatsCards} from '@/components/admin/molecules/client/StatsCards'

interface SchoolPeopleClientProps {
  students: Student[]
  teachers: Teacher[]
}

export function SchoolPeopleClient({students, teachers}: SchoolPeopleClientProps) {
  const [selectedType, setSelectedType] = useState<EntityType | null>(null)

  const people = useMemo(() => {
    return [
      {
        title: 'Total Élèves',
        value: students.length,
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-600',
        type: 'students' as EntityType,
        data: selectedType === 'students' ? students : [],
      },
      {
        title: 'Total Professeurs',
        value: teachers.length,
        icon: GraduationCap,
        color: 'text-green-600',
        bgColor: 'bg-green-600',
        type: 'teachers' as EntityType,
        data: selectedType === 'teachers' ? teachers : [],
      },
    ]
  }, [students, teachers, selectedType])

  return <StatsCards people={people} selectedType={selectedType} onSelectType={setSelectedType} />
}
