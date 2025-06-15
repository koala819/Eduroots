'use server'

import { ReactNode, Suspense } from 'react'

import GlobalLoadingIndicator from '@/components/atoms/client/ContextLoader'
import LoadingFallback from '@/components/atoms/client/LoadingFallback'

import AttendancesServerComponent from '@/context/Attendances/server'
import BehaviorsServerComponent from '@/context/Behaviors/server'
import CoursesServerComponent from '@/context/Courses/server'
import GradesServerComponent from '@/context/Grades/server'
import HolidaysServerComponent from '@/context/Holidays/server'
import SchedulesServerComponent from '@/context/Schedules/server'
import StatsServerComponent from '@/context/Stats/server'
import StudentsServerComponent from '@/context/Students/server'
import TeachersServerComponent from '@/context/Teachers/server'

export default async function GlobalServerProvider({ children }: {children: ReactNode}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
