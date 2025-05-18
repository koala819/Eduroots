'use server'

import { statsStudentUpdate } from '@/migrations/stats-student-update'

export async function updateStudentStats() {
  return statsStudentUpdate()
}
