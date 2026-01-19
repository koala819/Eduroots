#!/usr/bin/env node

/**
 * Script pour vérifier et démarrer automatiquement les services Docker Compose
 * avant de lancer l'application de développement
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

const COMPOSE_FILE = 'compose.yml'
const REQUIRED_SERVICES = ['postgres', 'rest', 'auth', 'meta']

/**
 * Vérifie si Docker est disponible
 */
function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' })
    execSync('docker-compose --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Vérifie si un service Docker est en cours d'exécution
 */
function isServiceRunning(serviceName) {
  try {
    const output = execSync(
      `docker-compose ps -q ${serviceName}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    return output.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Démarre les services Docker Compose
 */
function startDockerServices() {
  try {
    console.log('🚀 Démarrage des services Docker Compose...')
    execSync('docker-compose up -d', { stdio: 'inherit' })
    console.log('✅ Services Docker démarrés avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur lors du démarrage des services Docker:', error.message)
    return false
  }
}

/**
 * Vérifie si tous les services requis sont en cours d'exécution
 */
function checkRequiredServices() {
  const missingServices = []

  for (const service of REQUIRED_SERVICES) {
    if (!isServiceRunning(service)) {
      missingServices.push(service)
    }
  }

  return missingServices
}

/**
 * Fonction principale
 */
function main() {
  // Vérifier si le fichier compose.yml existe
  if (!existsSync(COMPOSE_FILE)) {
    console.warn(`⚠️  Fichier ${COMPOSE_FILE} introuvable. Ignorant la vérification Docker.`)
    process.exit(0)
  }

  // Vérifier si Docker est disponible
  if (!isDockerAvailable()) {
    console.warn('⚠️  Docker n\'est pas disponible. Assurez-vous que Docker est installé et démarré.')
    console.warn('   L\'application peut ne pas fonctionner correctement sans les services Docker.')
    process.exit(0)
  }

  // Vérifier les services requis
  const missingServices = checkRequiredServices()

  if (missingServices.length > 0) {
    console.log(`📦 Services manquants détectés: ${missingServices.join(', ')}`)
    console.log('   Démarrage automatique des services...')

    if (!startDockerServices()) {
      console.error('❌ Impossible de démarrer les services Docker.')
      console.error('   Veuillez démarrer manuellement avec: docker-compose up -d')
      process.exit(1)
    }

    // Attendre un peu pour que les services démarrent
    console.log('⏳ Attente du démarrage des services...')
    setTimeout(() => {
      const stillMissing = checkRequiredServices()
      if (stillMissing.length > 0) {
        console.warn(`⚠️  Certains services ne sont pas encore prêts: ${stillMissing.join(', ')}`)
        console.warn('   L\'application peut démarrer mais certains services peuvent ne pas être disponibles.')
      } else {
        console.log('✅ Tous les services sont prêts')
      }
      process.exit(0)
    }, 3000)
  } else {
    console.log('✅ Tous les services Docker sont déjà en cours d\'exécution')
    process.exit(0)
  }
}

main()
