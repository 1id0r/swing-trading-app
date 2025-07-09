// src/lib/api-client.ts
import { auth } from '@/lib/firebase';

/**
 * Authenticated fetch wrapper that includes Firebase auth headers
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  // Get the current user's ID token
  const idToken = await currentUser.getIdToken();
  
  // Get the database user ID from your auth context or store
  // You might need to adjust this based on how you store the dbUserId
  const dbUserId = localStorage.getItem('dbUserId'); // or get from your auth context
  
  const headers = new Headers(options.headers);
  
  // Add authentication headers
  headers.set('Authorization', `Bearer ${idToken}`);
  headers.set('x-firebase-uid', currentUser.uid);
  
  if (dbUserId) {
    headers.set('x-user-id', dbUserId);
  }
  
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized - maybe redirect to login
    console.error('API call unauthorized:', url);
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
  get: (url: string) => authenticatedFetch(url),
  
  post: (url: string, data: any) => 
    authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: (url: string, data: any) => 
    authenticatedFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (url: string) => 
    authenticatedFetch(url, { method: 'DELETE' }),
};

/**
 * Example usage in your components/hooks:
 * 
 * const response = await apiClient.get('/api/positions?updatePrices=true');
 * const data = await response.json();
 */