// import { useSession } from 'next-auth/react'
// import { useEffect, useState } from 'react'

// import { AttendanceStats, PopulatedAttendance } from '@/types/attendance'
// import { Course } from '@/types/course'

// import { useAttendance } from '@/context/AttendanceContext'
// import { useCourses } from '@/context/CourseContext'
// import { useTeachers } from '@/context/TeacherContext'

// interface UseAttendanceDataReturn {
//   //   attendances: PopulatedAttendance[]
//   isLoading: boolean
//   error: string | null
//   //   course: Course | null
//   stats: AttendanceStats | null
//   refreshData: () => Promise<void>
// }

// export const useAttendanceData = (
//   courseId: string,
// ): UseAttendanceDataReturn => {
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const { fetchAttendanceCheck, stats } = useAttendance()
//   const { data: session } = useSession()

//   const refreshData = async () => {
//     if (!courseId) {
//       console.error('No courseId provided')
//       setError('ID du cours manquant')
//       return
//     }

//     setIsLoading(true)
//     setError(null)

//     console.log('useAttendanceData:', {
//       courseId,
//       //   teacher: session?.user?.id,
//     })

//     try {
//       const result = await fetchAttendanceCheck({ courseId: courseId })
//       console.log('fetchAttendanceCheck result:', result)

//       if (!result) {
//         throw new Error('Données invalides reçues de fetchAttendanceCheck')
//       }

//       //   setAttendances(result.checkedAttendances as any)
//     } catch (err) {
//       console.error('Error in refreshData:', err)
//       setError(err instanceof Error ? err.message : 'Une erreur est survenue')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     console.log('useEffect triggered with courseId:', courseId)
//     if (session?.user?.id) {
//       refreshData()
//     }
//   }, [courseId, session?.user?.id])

//   // Effet pour charger les données initiales
//   useEffect(() => {
//     refreshData()
//   }, [courseId])

//   return {
//     // attendances,
//     isLoading,
//     error,
//     // course,
//     stats,
//     refreshData,
//   }
// }

export const useAttendanceData = () => {}
