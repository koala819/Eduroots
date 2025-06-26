'use server'

import { ReactNode, Suspense } from 'react'

import GlobalLoadingIndicator from '@/client/components/molecules/ContextLoader'
import AttendancesServerComponent from '@/server/context/attendances'
import BehaviorsServerComponent from '@/server/context/behaviors'
import CoursesServerComponent from '@/server/context/courses'
import GradesServerComponent from '@/server/context/grades'
import HolidaysServerComponent from '@/server/context/holidays'
import SchedulesServerComponent from '@/server/context/schedules'
import StatsServerComponent from '@/server/context/stats'
import StudentsServerComponent from '@/server/context/students'
import TeachersServerComponent from '@/server/context/teachers'
import LoadingOverlay from '@/zUnused/LoadingOverlay'

export default async function GlobalServerProvider({ children }: Readonly<{children: ReactNode}>) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <StatsServerComponent>
        <TeachersServerComponent>
          <CoursesServerComponent>
            <StudentsServerComponent>
              <AttendancesServerComponent>
                <BehaviorsServerComponent>
                  <GradesServerComponent>
                    <HolidaysServerComponent>
                      <SchedulesServerComponent>
                        <GlobalLoadingIndicator />
                        {children}
                      </SchedulesServerComponent>
                    </HolidaysServerComponent>
                  </GradesServerComponent>
                </BehaviorsServerComponent>
              </AttendancesServerComponent>
            </StudentsServerComponent>
          </CoursesServerComponent>
        </TeachersServerComponent>
      </StatsServerComponent>
    </Suspense>
  )
}
