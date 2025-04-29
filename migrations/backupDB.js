import dbConnect from '@/backend/config/dbConnect'
import fs from 'fs/promises'
import path from 'path'

export async function backupCollection(Model, collectionName) {
  try {
    await dbConnect()
    const documents = await Model.find({}).lean()
    const backupPath = path.join(process.cwd(), 'backup')
    await fs.mkdir(backupPath, {recursive: true})
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `${collectionName}_backup_${timestamp}.json`
    const filePath = path.join(backupPath, fileName)
    await fs.writeFile(filePath, JSON.stringify(documents, null, 2))
    console.log(`Backup créé avec succès : ${filePath}`)
    return filePath
  } catch (error) {
    console.error(`Erreur lors de la création du backup pour ${collectionName} :`, error)
    throw error
  }
}
