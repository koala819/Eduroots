import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/db'
import fs from 'fs/promises'
import path from 'path'

type GradeDB = Database['public']['Tables']['grades']['Row']

/**
 * Main function to clean up the Grade database
 */
export async function statsGradesClean(): Promise<{
  success: boolean
  message: string
  backupPath: string | null
}> {
  const supabase = await createClient()
  try {
    // Create backup
    const backupPath = await backupGradeCollection()

    // Get initial count of grades
    const { count: initialGradeCount, error: countError } = await supabase
      .schema('education')
      .from('grades')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('Error fetching initial grade count:', countError)
      throw countError
    }

    // Get all unique course_session_ids from the Grade collection
    const { data: distinctGrades, error: distinctError } = await supabase
      .schema('education')
      .from('grades')
      .select('course_session_id')

    if (distinctError) {
      console.error('Error fetching distinct course_session_ids:', distinctError)
      throw distinctError
    }

    const courseSessionIds = [
      ...new Set(distinctGrades?.map((g) => g.course_session_id).filter(Boolean) || []),
    ] as string[]

    // Check which course_session_ids don't exist in the courses_sessions table
    const nonExistentSessionIds: string[] = []

    for (const sessionId of courseSessionIds) {
      const { data: sessionExists, error: sessionCheckError } = await supabase
        .schema('education')
        .from('courses_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('id', sessionId)

      if (sessionCheckError) {
        console.warn(`Error checking session ${sessionId}:`, sessionCheckError.message)
        // Decide if you want to skip or include in nonExistentSessionIds based on error
        continue
      }

      if (!sessionExists || (sessionExists as any).count === 0) {
        nonExistentSessionIds.push(sessionId)
      }
    }

    // Delete grades with non-existent course_session_ids
    if (nonExistentSessionIds.length > 0) {
      const {  error: deleteError } = await supabase
        .schema('education')
        .from('grades')
        .delete({ count: 'exact' })
        .in('course_session_id', nonExistentSessionIds)

      if (deleteError) {
        console.error('Error deleting grades:', deleteError)
        throw deleteError
      }
    } else {
      console.log('No grades with non-existent course_session_ids found')
    }

    // Get final count of grades
    const { error: finalCountError } = await supabase
      .schema('education')
      .from('grades')
      .select('id', { count: 'exact', head: true })

    if (finalCountError) {
      console.error('Error fetching final grade count:', finalCountError)
      throw finalCountError
    }



    return {
      success: true,
      message: 'Grades cleaned up successfully',
      backupPath,
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return {
      success: false,
      message: `An error occurred while cleaning up grades ::${
        error instanceof Error ? error.message : String(error)
      }`,
      backupPath: null,
    }
  }
}

/**
 * Creates a backup of the Grade collection
 */
async function backupGradeCollection(): Promise<string> {
  const supabase = await createClient()
  try {

    const backupPath = path.join(process.cwd(), 'backup')
    await fs.mkdir(backupPath, { recursive: true })

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const backupFileName = `grade_backup_${timestamp}.json`
    const backupFilePath = path.join(backupPath, backupFileName)

    // Fetch all grades
    const { data: grades, error } = await supabase
      .schema('education')
      .from('grades')
      .select('*')

    if (error) {
      console.error('Error fetching grades for backup:', error)
      throw error
    }

    // Write to backup file
    await fs.writeFile(backupFilePath, JSON.stringify(grades, null, 2))

    return backupFilePath
  } catch (error) {
    console.error('❌ Erreur lors de la création du backup', error)
    throw error
  }
}
