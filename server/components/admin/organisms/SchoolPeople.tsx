import { SchoolPeopleClient } from '@/client/components/organisms/SchoolPeople'
import { getAllStudents } from '@/server/actions/api/students'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { StudentResponse } from '@/types/student-payload'
import { TeacherResponse } from '@/types/teacher-payload'

export async function SchoolPeople() {
  const [studentsResponse, teachersResponse] = await Promise.all([
    getAllStudents(),
    getAllTeachers(),
  ])

  const students =
    studentsResponse.success ? (studentsResponse.data as StudentResponse[]) : []
  const teachers =
    teachersResponse.success ? (teachersResponse.data as TeacherResponse[]) : []

  return <SchoolPeopleClient students={students} teachers={teachers} />
}
