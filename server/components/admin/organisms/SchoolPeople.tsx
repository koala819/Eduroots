import { Student, Teacher } from '@/types/mongo/user'

import { SchoolPeopleClient } from '@/client//components/organisms/SchoolPeople'

import { getAllStudents } from '@/app/server/actions/context/students'
import { getAllTeachers } from '@/app/server/actions/context/teachers'

export async function SchoolPeople() {
  const [studentsResponse, teachersResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
  ])

  const students = studentsResponse.success ? (studentsResponse.data as unknown as Student[]) : []
  const teachers = teachersResponse.success ? (teachersResponse.data as unknown as Teacher[]) : []

  return <SchoolPeopleClient students={students} teachers={teachers} />
}
