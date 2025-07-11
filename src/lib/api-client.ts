import { useAuth } from '@/app/contexts/AuthContext'

export function useApiClient() {
  const { getAuthHeaders } = useAuth()

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = await getAuthHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response
  }

  return {
    get: (url: string) => apiCall(url),
    post: (url: string, data: any) => apiCall(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    put: (url: string, data: any) => apiCall(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (url: string) => apiCall(url, { method: 'DELETE' }),
  }
}