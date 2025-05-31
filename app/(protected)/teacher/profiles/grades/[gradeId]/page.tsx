import { GradeEdit } from '@/components/pages/client/TeacherGrades'

type Params = Promise<{ id: string }>;

export default async function GradeEditPage({ params }: { params: Params }) {
  const { id: gradeId } = await params;

  return (
    <GradeEdit gradeId={gradeId} />
  )
}