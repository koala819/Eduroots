import bcrypt from 'bcryptjs'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

rl.question('Entrez le mot de passe à hacher: ', async (password) => {
  try {
    const hashedPassword = await hashPassword(password)
    console.log('Mot de passe haché:', hashedPassword)
  } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error)
  } finally {
    rl.close()
  }
})
