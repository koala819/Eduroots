import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

import { SchoolPeopleClient } from '@/client/components/organisms/SchoolPeople'

import { getAllStudents } from '@/server/actions/context/students'
import { getAllTeachers } from '@/server/actions/context/teachers'

export async function SchoolPeople() {
  const [studentsResponse, teachersResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
  ])

  const students =
    studentsResponse.success ? (studentsResponse.data as unknown as StudentResponse[]) : []
  const teachers =
    teachersResponse.success ? (teachersResponse.data as unknown as TeacherResponse[]) : []

  return <SchoolPeopleClient students={students} teachers={teachers} />
}
