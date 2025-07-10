// Create this file: /src/stores/useWatchlistStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WatchlistItem {
  id: string
  ticker: string
  company: string
  logo?: string
  addedDate: string
}

export interface WatchlistFolder {
  id: string
  name: string
  isExpanded: boolean
  items: WatchlistItem[]
}

interface WatchlistStore {
  folders: WatchlistFolder[]
  
  // Folder actions
  addFolder: (name: string) => void
  deleteFolder: (folderId: string) => void
  renameFolder: (folderId: string, newName: string) => void
  toggleFolder: (folderId: string) => void
  
  // Item actions
  addItemToFolder: (folderId: string, item: Omit<WatchlistItem, 'id' | 'addedDate'>) => void
  removeItemFromFolder: (folderId: string, itemId: string) => void
  moveItemBetweenFolders: (fromFolderId: string, toFolderId: string, itemId: string) => void
  
  // Utility
  getAllSymbols: () => string[]
  findItemInFolders: (ticker: string) => { folder: WatchlistFolder; item: WatchlistItem } | null
}

const defaultFolders: WatchlistFolder[] = [
  {
    id: 'crypto',
    name: 'Crypto',
    isExpanded: true,
    items: []
  },
  {
    id: 'tech',
    name: 'Tech Stocks',
    isExpanded: true,
    items: []
  },
  {
    id: 'israeli',
    name: 'Israeli Stocks',
    isExpanded: false,
    items: []
  }
]

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      folders: defaultFolders,

      addFolder: (name: string) => {
        const newFolder: WatchlistFolder = {
          id: `folder_${Date.now()}`,
          name,
          isExpanded: true,
          items: []
        }
        set((state) => ({
          folders: [...state.folders, newFolder]
        }))
      },

      deleteFolder: (folderId: string) => {
        set((state) => ({
          folders: state.folders.filter(folder => folder.id !== folderId)
        }))
      },

      renameFolder: (folderId: string, newName: string) => {
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId ? { ...folder, name: newName } : folder
          )
        }))
      },

      toggleFolder: (folderId: string) => {
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
          )
        }))
      },

      addItemToFolder: (folderId: string, item: Omit<WatchlistItem, 'id' | 'addedDate'>) => {
        const newItem: WatchlistItem = {
          ...item,
          id: `item_${Date.now()}`,
          addedDate: new Date().toISOString()
        }

        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId
              ? { ...folder, items: [...folder.items, newItem] }
              : folder
          )
        }))
      },

      removeItemFromFolder: (folderId: string, itemId: string) => {
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId
              ? { ...folder, items: folder.items.filter(item => item.id !== itemId) }
              : folder
          )
        }))
      },

      moveItemBetweenFolders: (fromFolderId: string, toFolderId: string, itemId: string) => {
        const state = get()
        const fromFolder = state.folders.find(f => f.id === fromFolderId)
        const item = fromFolder?.items.find(i => i.id === itemId)

        if (!item || fromFolderId === toFolderId) return

        set((state) => ({
          folders: state.folders.map(folder => {
            if (folder.id === fromFolderId) {
              return { ...folder, items: folder.items.filter(i => i.id !== itemId) }
            }
            if (folder.id === toFolderId) {
              return { ...folder, items: [...folder.items, item] }
            }
            return folder
          })
        }))
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
    }),
    {
      name: 'watchlist-storage',
      version: 1
    }
  )
)