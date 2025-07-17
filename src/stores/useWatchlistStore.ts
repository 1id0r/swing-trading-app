// Replace your existing useWatchlistStore.ts with this version
import { create } from 'zustand'
import { auth } from '@/lib/firebase'

export interface WatchlistItem {
  id: string
  folderId: string
  userId: string
  ticker: string
  company?: string
  logo?: string
  addedDate: string
  position: number
}

export interface WatchlistFolder {
  id: string
  userId: string
  name: string
  isExpanded: boolean
  position: number
  createdAt: string
  updatedAt: string
  items: WatchlistItem[]
}

interface WatchlistStore {
  folders: WatchlistFolder[]
  loading: boolean
  error: string | null
  
  // API actions
  fetchWatchlist: () => Promise<void>
  
  // Folder actions
  addFolder: (name: string) => Promise<void>
  deleteFolder: (folderId: string) => Promise<void>
  renameFolder: (folderId: string, newName: string) => Promise<void>
  toggleFolder: (folderId: string) => Promise<void>
  
  // Item actions
  addItemToFolder: (folderId: string, item: { ticker: string; company?: string; logo?: string }) => Promise<void>
  removeItemFromFolder: (folderId: string, itemId: string) => Promise<void>
  moveItemBetweenFolders: (fromFolderId: string, toFolderId: string, itemId: string) => Promise<void>
  
  // Utility
  getAllSymbols: () => string[]
  findItemInFolders: (ticker: string) => { folder: WatchlistFolder; item: WatchlistItem } | null
  
  // Local state helpers
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// ✅ FIXED: Helper function to get Firebase ID token headers (same as useTradeStore)
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Get the Firebase ID token
    const idToken = await currentUser.getIdToken()
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`, // ✅ This is what your API expects
    }
  } catch (error) {
    console.error('❌ Error getting auth headers:', error)
    throw new Error('Authentication failed')
  }
}

// API helper function with proper Firebase auth
const apiCall = async (url: string, options: RequestInit = {}) => {
  const headers = await getAuthHeaders() // ✅ Get Firebase token properly

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  folders: [],
  loading: false,
  error: null,

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  fetchWatchlist: async () => {
    try {
      set({ loading: true, error: null })
      const data = await apiCall('/api/watchlist')
      set({ folders: data.folders, loading: false })
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
      set({ error: (error as Error).message, loading: false })
    }
  },

  addFolder: async (name: string) => {
    try {
      set({ loading: true, error: null })
      const data = await apiCall('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ action: 'createFolder', name }),
      })
      
      const newFolder = { ...data.folder, items: [] }
      set((state) => ({
        folders: [...state.folders, newFolder],
        loading: false
      }))
    } catch (error) {
      console.error('Failed to add folder:', error)
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  deleteFolder: async (folderId: string) => {
    try {
      set({ loading: true, error: null })
      await apiCall('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteFolder', folderId }),
      })
      
      set((state) => ({
        folders: state.folders.filter(folder => folder.id !== folderId),
        loading: false
      }))
    } catch (error) {
      console.error('Failed to delete folder:', error)
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  renameFolder: async (folderId: string, newName: string) => {
    try {
      set({ loading: true, error: null })
      const data = await apiCall('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ action: 'renameFolder', folderId, name: newName }),
      })
      
      set((state) => ({
        folders: state.folders.map(folder =>
          folder.id === folderId ? { ...folder, name: data.folder.name, updatedAt: data.folder.updatedAt } : folder
        ),
        loading: false
      }))
    } catch (error) {
      console.error('Failed to rename folder:', error)
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  toggleFolder: async (folderId: string) => {
    try {
      // Optimistic update
      set((state) => ({
        folders: state.folders.map(folder =>
          folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
        )
      }))

      await apiCall('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ action: 'toggleFolder', folderId }),
      })
    } catch (error) {
      console.error('Failed to toggle folder:', error)
      // Revert optimistic update
      set((state) => ({
        folders: state.folders.map(folder =>
          folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
        ),
        error: (error as Error).message
      }))
    }
  },

  // Replace the addItemToFolder function in your useWatchlistStore with this debug version:

addItemToFolder: async (folderId: string, item: { ticker: string; company?: string; logo?: string }) => {
  try {
    // 🔍 DEBUG: Log what we're receiving
    console.log('🐛 addItemToFolder called with:', {
      folderId,
      item,
      folders: get().folders.map(f => ({ id: f.id, name: f.name }))
      
    })

    set({ loading: true, error: null })
    
    // 🔍 DEBUG: Log the payload being sent
    const payload = { action: 'addItem', folderId, ...item }
    console.log('🐛 Sending payload:', payload)
    
    const data = await apiCall('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify(payload),
    })



    console.log('🐛 API response:', data)
    
    set((state) => ({
      folders: state.folders.map(folder =>
        folder.id === folderId
          ? { ...folder, items: [...folder.items, data.item] }
          : folder
      ),
      loading: false
      
    }))
  } catch (error) {
    console.error('❌ Failed to add item:', error)
    console.error('🐛 Error details:', {
      folderId,
      item,
      error: (error as Error).message
    })
    set({ error: (error as Error).message, loading: false })
    throw error
  }
},

  removeItemFromFolder: async (folderId: string, itemId: string) => {
    try {
      set({ loading: true, error: null })
      await apiCall('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ action: 'removeItem', folderId, itemId }),
      })
      
      set((state) => ({
        folders: state.folders.map(folder =>
          folder.id === folderId
            ? { ...folder, items: folder.items.filter(item => item.id !== itemId) }
            : folder
        ),
        loading: false
      }))
    } catch (error) {
      console.error('Failed to remove item:', error)
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  moveItemBetweenFolders: async (fromFolderId: string, toFolderId: string, itemId: string) => {
    try {
      const state = get()
      const fromFolder = state.folders.find(f => f.id === fromFolderId)
      const item = fromFolder?.items.find(i => i.id === itemId)

      if (!item || fromFolderId === toFolderId) return

      set({ loading: true, error: null })
      const data = await apiCall('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ action: 'moveItem', fromFolderId, toFolderId, itemId }),
      })

      set((state) => ({
        folders: state.folders.map(folder => {
          if (folder.id === fromFolderId) {
            return { ...folder, items: folder.items.filter(i => i.id !== itemId) }
          }
          if (folder.id === toFolderId) {
            return { ...folder, items: [...folder.items, data.item] }
          }
          return folder
        }),
        loading: false
      }))
    } catch (error) {
      console.error('Failed to move item:', error)
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  getAllSymbols: () => {
    const state = get()
    return state.folders.flatMap(folder => folder.items.map(item => item.ticker))
  },

  findItemInFolders: (ticker: string) => {
    const state = get()
    for (const folder of state.folders) {
      const item = folder.items.find(item => item.ticker.toLowerCase() === ticker.toLowerCase())
      if (item) {
        return { folder, item }
      }
    }
    return null
  }
}))