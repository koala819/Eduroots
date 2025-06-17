import { GradeEdit } from '@/client/components/pages/TeacherGrades'

type Params = Promise<{ id: string }>;

export default async function GradeEditPage({ params }: { params: Params }) {
  const { id: gradeId } = await params

  return (
    <GradeEdit gradeId={gradeId} />
  )
}
