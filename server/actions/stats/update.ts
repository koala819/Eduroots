'use server'

import { statsStudentUpdate } from '@/server/utils/stats/stats-student-update'

export async function updateStudentStats() {
  return statsStudentUpdate()
}
