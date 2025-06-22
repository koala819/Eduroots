'use client'
import { useEffect } from 'react'

export const SuppressReact19Warning = () => {
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        args[0].includes('Accessing element.ref was removed in React 19')
      ) {
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return null
}
