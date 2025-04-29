import {toast} from 'react-toastify'

import {fetchWithAuth} from '@/lib/fetchWithAuth'

export async function deleteUser(url: string, id: string) {
  try {
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
      body: {id},
    })

    if (response) {
      return {
        status: response.status,
        statusText: response.statusText,
      }
    } else {
      throw new Error('Failed to delete resource')
    }
  } catch (error: any) {
    toast.error('Error deleting resource: ' + (error.message || error.toString()))
    return {
      status: 500,
      statusText: 'Internal Server Error',
    }
  }
}
