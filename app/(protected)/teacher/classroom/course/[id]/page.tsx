import {getCourseById} from '@/app/actions/context/courses'
import { ErrorComponent } from '@/components/atoms/client/ErrorComponent';
import { PopulatedCourse } from '@/types/course';
import {generateWeeklyDates} from '@/lib/utils'
import { TeacherCourses } from '@/components/pages/client/TeacherCourses'


type Params = Promise<{ id: string }>;

export default async function CoursePage({ params }: { params: Params }) {
  const { id: courseId } = await params;

  const response = await getCourseById(courseId);

  if (!response.success) {
    return <ErrorComponent message={response.message || 'Erreur lors du chargement du cours'} />;
  }

  const courseData = response.data as unknown as PopulatedCourse;
    const selectedSession = courseData.sessions.find((session) => session.id === courseId);

    if (!selectedSession) {
    return <ErrorComponent message="Session de cours introuvable" />;
  }

  const courseDates = generateWeeklyDates(selectedSession.timeSlot.dayOfWeek);
   const sortedStudents = [...selectedSession.students].sort((a, b) =>
    `${a.lastname} ${a.firstname}`.localeCompare(`${b.lastname} ${b.firstname}`),
  );
  return (
    <TeacherCourses
      courseId={courseId}
      courseDates={courseDates}
      sortedStudents={sortedStudents}
    />
  )
}