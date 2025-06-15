// lib/serialization.ts

/**
 * Types pour représenter les valeurs spéciales MongoDB après sérialisation
 */
type SerializedDate = {$date: string}
type SerializedObjectId = {$oid: string}
type SerializedBinary = {$binary: string}

/**
 * Type union pour les valeurs spéciales après sérialisation
 */
type SerializedSpecialValue = SerializedDate | SerializedObjectId | SerializedBinary

/**
 * Type récursif pour représenter une valeur sérialisée
 */
export type SerializedValue =
  | null
  | undefined
  | string
  | number
  | boolean
  | SerializedSpecialValue
  | SerializedValue[]
  | {[key: string]: SerializedValue}

/**
 * Méthode simple, robuste et sûre pour sérialiser des données Mongoose
 *
 * Cette fonction évite les boucles infinies en utilisant JSON.stringify/parse
 * avec une fonction de remplacement personnalisée pour gérer les types spéciaux
 * comme ObjectId et Date
 *
 * @param data - Les données à sérialiser (peut être n'importe quel type de données)
 * @returns Les données sérialisées sous forme d'objets JavaScript simples
 */
export function serializeData<T>(data: T): SerializedValue {
  // Méthode sûre : utiliser JSON.stringify puis JSON.parse
  // avec un remplaceur personnalisé pour gérer les types spéciaux
  try {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        // Gérer les dates
        if (value instanceof Date) {
          return { $date: value.toISOString() } as SerializedDate
        }

        // Gérer les ObjectId
        if (
          value &&
          typeof value === 'object' &&
          '_bsontype' in value &&
          value._bsontype === 'ObjectID' &&
          typeof value.toString === 'function'
        ) {
          return { $oid: value.toString() } as SerializedObjectId
        }

        // Gérer les Buffer (comme dans les ObjectId)
        if (Buffer.isBuffer(value)) {
          return { $binary: value.toString('hex') } as SerializedBinary
        }

        // Par défaut, retourner la valeur telle quelle
        return value
      }),
    )
  } catch (error) {
    console.error('Erreur lors de la sérialisation:', error)
    // En cas d'erreur, essayons une méthode plus simple
    return simpleSerialization(data)
  }
}

/**
 * Interface pour les objets qui ont une méthode toObject (comme les documents Mongoose)
 */
interface WithToObject {
  toObject: () => unknown
}

/**
 * Type guard pour vérifier si un objet a une méthode toObject
 */
function hasToObject(obj: unknown): obj is WithToObject {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'toObject' in obj &&
    typeof (obj as WithToObject).toObject === 'function'
  )
}

/**
 * Type guard pour vérifier si un objet a une méthode toString
 */
function hasToString(obj: unknown): obj is {toString: () => string} {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'toString' in obj &&
    typeof (obj as {toString: () => string}).toString === 'function'
  )
}

/**
 * Méthode de secours en cas d'échec de la méthode principale
 * Cette méthode ne gère que les types les plus courants mais est
 * plus robuste face aux structures de données complexes
 *
 * @param data - Les données à sérialiser
 * @returns Les données sérialisées sous forme d'objets JavaScript simples
 */
function simpleSerialization(data: unknown): SerializedValue {
  // Cas de base pour les valeurs primitives
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data as string | number | boolean

  // Cas pour les tableaux
  if (Array.isArray(data)) {
    return data.map((item) => simpleSerialization(item))
  }

  // Cas pour les dates
  if (data instanceof Date) {
    return data.toISOString()
  }

  // Cas pour les documents Mongoose
  if (hasToObject(data)) {
    return simpleSerialization(data.toObject())
  }

  // Pour les objets ordinaires, créer un nouvel objet avec seulement
  // les propriétés énumérables et non-circulaires
  const result: Record<string, SerializedValue> = {}

  // Ne traiter que les propriétés propres à l'objet
  const keys = Object.keys(data as object)

  for (const key of keys) {
    // Ignorer certaines propriétés MongoDB/Mongoose spéciales
    if (
      key === '_id' &&
      (data as Record<string, unknown>)[key] !== undefined &&
      hasToString((data as Record<string, unknown>)[key])
    ) {
      // Convertir ObjectId en string
      result[key] = (data as Record<string, {toString: () => string}>)[key].toString()
    } else if (key === '__v' || key === '_doc' || key.startsWith('$')) {
      // Ignorer ces propriétés internes
      continue
    } else {
      try {
        // Pour les autres propriétés, essayer de les sérialiser
        // mais ignorer celles qui causent des problèmes
        const value: unknown = (data as Record<string, unknown>)[key]
        if (value !== data) {
          // Éviter les références circulaires directes
          result[key] = simpleSerialization(value)
        }
      } catch (e) {
        // Ignorer les propriétés qui causent des erreurs
        console.warn(`Impossible de sérialiser la propriété ${key}:`, e)
      }
    }
  }

  return result
}
