'use server'

import { statsStudentUpdate } from '@/zUnused/migrations/stats-student-update'

export async function updateStudentStats() {
  return statsStudentUpdate()
}
