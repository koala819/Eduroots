import dbConnect from '@/backend/config/dbConnect'
import {User} from '@/backend/models/user.model'
import fs from 'fs/promises'
import path from 'path'

export async function backupUsers() {
  try {
    await dbConnect()

    const users = await User.find({}).lean()

    const backupPath = path.join(process.cwd(), 'backup')
    await fs.mkdir(backupPath, {recursive: true})

    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `users_backup_${timestamp}.json`
    const filePath = path.join(backupPath, fileName)

    await fs.writeFile(filePath, JSON.stringify(users, null, 2))

    console.log(`Backup créé avec succès : ${filePath}`)
    return filePath
  } catch (error) {
    console.error('Erreur lors de la création du backup :', error)
    throw error
  }
}
