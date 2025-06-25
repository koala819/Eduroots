'use server'

import { migrateUserToSuffixedEmail } from '@/server/utils/auth-helpers'

export async function migrateUserAction(
  authUserId: string,
  currentEmail: string,
  role: string,
  newPassword: string,
) {
  return await migrateUserToSuffixedEmail(authUserId, currentEmail, role, newPassword)
}
