import { initializeModels } from './init-models'

import mongoose from 'mongoose'

interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

interface CustomGlobalThis {
  mongooseCache: CachedConnection
}

declare global {
  let mongooseCache: CachedConnection | undefined
}

const typedGlobalThis = globalThis as unknown as CustomGlobalThis
typedGlobalThis.mongooseCache = typedGlobalThis.mongooseCache || {
  conn: null,
  promise: null,
}

const connectWithRetry = async (
  uri: string,
  options: any,
  retries = 3,
): Promise<typeof mongoose> => {
  try {
    return await mongoose.connect(uri, options)
  } catch (err) {
    if (retries <= 0) throw err
    console.log(`Connexion échouée, nouvelle tentative dans 5s... (${retries} restantes)`)
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return connectWithRetry(uri, options, retries - 1)
  }
}

const dbConnect = async () => {
  // If already connected, return the connection
  if (typedGlobalThis.mongooseCache.conn) {
    return typedGlobalThis.mongooseCache.conn
  }

  const dbUri = process.env.MONGODB_URI
  if (!dbUri) {
    throw new Error('The MONGODB_URI environment variable is not set.')
  }

  // Special handling for Vercel
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment, using special connection settings')

    // Clear any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log('Disconnected existing MongoDB connection')
    }

    // Reset connection cache
    typedGlobalThis.mongooseCache.conn = null
    typedGlobalThis.mongooseCache.promise = null
  }

  try {
    if (typedGlobalThis.mongooseCache.promise) {
      typedGlobalThis.mongooseCache.conn = await typedGlobalThis.mongooseCache.promise
      return typedGlobalThis.mongooseCache.conn
    }

    typedGlobalThis.mongooseCache.promise = connectWithRetry(dbUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 5,
      maxIdleTimeMS: 60000,
      family: 4,
      autoIndex: false,
      minPoolSize: 0,
    })

    typedGlobalThis.mongooseCache.conn = await typedGlobalThis.mongooseCache.promise
    initializeModels()

    // Add a double-check that connection was successful
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB connection not established after connect call')
      throw new Error('Failed to establish connection')
    }

    console.log('Successfully connected to the database.')
    return typedGlobalThis.mongooseCache.conn
  } catch (error) {
    typedGlobalThis.mongooseCache.promise = null
    typedGlobalThis.mongooseCache.conn = null
    console.error('Database connection error:', error)
    throw error
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from database')
  typedGlobalThis.mongooseCache.conn = null
  typedGlobalThis.mongooseCache.promise = null
})

export default dbConnect

export const isConnected = () => {
  return mongoose.connection.readyState === 1
}
