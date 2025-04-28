import { Student, Teacher } from '@/types/user'

import { SchoolPeopleClient } from '@/components/admin/organisms/client/SchoolPeople'

import { getAllStudents } from '@/app/actions/context/students'
import { getAllTeachers } from '@/app/actions/context/teachers'

export async function SchoolPeople() {
  const [studentsResponse, teachersResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
  ])

  const students = studentsResponse.success
    ? (studentsResponse.data as unknown as Student[])
    : []
  const teachers = teachersResponse.success
    ? (teachersResponse.data as unknown as Teacher[])
    : []

  return <SchoolPeopleClient students={students} teachers={teachers} />
}
