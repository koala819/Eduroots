import dbConnect from '@/backend/config/dbConnect'
import { Course } from '@/backend/models/course.model'
import { Grade } from '@/backend/models/grade.model'
import fs from 'fs/promises'
import path from 'path'

/**
 * Main function to clean up the Grade database
 */
export async function statsGradesClean(): Promise<{
  success: boolean
  message: string
  backupPath: string | null
}> {
  try {
    await dbConnect()

    // Create backup
    const backupPath = await backupGradeCollection()

    // Get initial count of grades
    const initialGradeCount = await Grade.countDocuments()
    console.log(`Initial grade count: ${initialGradeCount}`)

    // Get all unique course IDs from the Grade collection
    console.log('Fetching all sessionId from Grade collection...')
    const sessionIds = await Grade.distinct('sessionId')
    console.log(
      `Found ${sessionIds.length} unique sessionId in Grade collection`,
    )

    // Check which course IDs don't exist in the Course collection
    console.log('Checking for non-existent sessionIds ...')
    const nonExistentSessionIds = []

    for (const sessionId of sessionIds) {
      const courseExists = await Course.findOne({ 'sessions._id': sessionId })

      if (!courseExists) {
        nonExistentSessionIds.push(sessionId)
      }
    }

    console.log(`Found ${nonExistentSessionIds.length} non-existent sessionIds`)

    // Delete grades with non-existent sessionIds
    if (nonExistentSessionIds.length > 0) {
      console.log('Removing grades with non-existent sessionIds...')
      const deleteResult = await Grade.deleteMany({
        sessionId: { $in: nonExistentSessionIds },
      })

      console.log(`Deleted ${deleteResult.deletedCount} grade records`)
    } else {
      console.log('No grades with non-existent sessionIds found')
    }

    // Get final count of grades
    const finalGradeCount = await Grade.countDocuments()

    // Generate summary report
    console.log('\n--- SUMMARY REPORT ---')
    console.log(`Backup created: ${backupPath}`)
    console.log(`Initial grade count: ${initialGradeCount}`)
    console.log(`Grades deleted: ${initialGradeCount - finalGradeCount}`)
    console.log(`Final grade count: ${finalGradeCount}`)
    console.log('---------------------\n')

    return {
      success: true,
      message: 'Grades cleaned up successfully',
      backupPath,
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return {
      success: false,
      message: `An error occurred while cleaning up grades ::${error instanceof Error ? error.message : error}`,
      backupPath: null,
    }
  }
}

/**
 * Creates a backup of the Grade collection
 */
async function backupGradeCollection(): Promise<string> {
  try {
    console.log('Creating backup of Grade collection...')

    const backupPath = path.join(process.cwd(), 'backup')
    await fs.mkdir(backupPath, { recursive: true })

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const backupFileName = `grade_backup_${timestamp}.json`
    const backupFilePath = path.join(backupPath, backupFileName)

    // Fetch all grades
    const grades = await Grade.find({}).lean()

    // Write to backup file
    await fs.writeFile(backupFilePath, JSON.stringify(grades, null, 2))

    console.log(`Backup created at: ${backupFilePath}`)
    return backupFilePath
  } catch (error) {
    console.error(`❌ Erreur lors de la création du backup`, error)
    throw error
  }
}
