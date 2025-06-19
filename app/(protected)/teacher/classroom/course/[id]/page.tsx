import { redirect } from 'next/navigation'


type Params = Promise<{ id: string }>

export default async function CoursePage({ params }: { params: Params }) {
  const { id: courseSessionId } = await params

  redirect(`/teacher/classroom/course/${courseSessionId}/attendance`)
}
