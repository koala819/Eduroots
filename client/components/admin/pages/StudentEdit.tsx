'use client'
import { PersonalCardInfo } from '@/client/components/admin/atoms/StudentCardPersonal'
import { CoursesCardInfo } from '@/client/components/admin/molecules/StudentCardCourses'
import { StudentCourseSession } from '@/types/courses'
import { StudentResponse } from '@/types/student-payload'

interface StudentEditProps {
  id: string
  studentPersonalData: StudentResponse
  studentCoursesData: StudentCourseSession[]
}

export const StudentEdit = ({
  id,
  studentPersonalData,
  studentCoursesData,
}: StudentEditProps) => {

  return (
    <div className="bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

        {/* Contenu principal */}
        <div className="space-y-4 md:space-y-6">
          <PersonalCardInfo id={id} data={studentPersonalData} />


          {/* Cours de l'étudiant */}
          {/* <Card className="hover:shadow-lg transition-all duration-300 border-border
            bg-white/80 backdrop-blur-sm hover:border-accent group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center
                  group-hover:bg-accent/20 transition-colors duration-300">
                  <GraduationCap className="h-4 w-4 text-accent" />
                </div>
                <CardTitle className="text-base text-foreground">Cours de l'étudiant</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditCourse}
                className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground
                  transition-colors"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent> */}
          <CoursesCardInfo studentId={id} data={studentCoursesData} />
          {/* </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )
}
