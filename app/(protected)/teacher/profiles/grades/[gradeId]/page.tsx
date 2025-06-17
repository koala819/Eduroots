import { GradeEdit } from '@/client/components/pages/TeacherGradesEdit'

type Params = Promise<{ id: string }>;

export default async function GradeEditPage({ params }: { params: Params }) {
  const { id: gradeId } = await params

  return (
    <GradeEdit gradeId={gradeId} />
  )
}
