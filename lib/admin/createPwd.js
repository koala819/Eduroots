// Importer les modules nécessaires
const bcrypt = require('bcryptjs')
const readline = require('readline')

// Créer une interface pour lire l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Fonction pour demander le mot de passe et afficher le mot de passe haché
const createHashedPassword = async () => {
  rl.question('Svp entrer votre mot de passe: ', async (password) => {
    if (password.length < 8) {
      console.log('Le mot de passe doit avoir au moins 8 caractères')
      rl.close()
      return
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log(`Votre mot de passe haché est: ${hashedPassword}`)
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe:', error)
    } finally {
      rl.close()
    }
  })
}

// Appeler la fonction pour créer le mot de passe haché
createHashedPassword()
