// Create this file: /src/app/api/watchlist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { watchlistOps } from '@/lib/db-operations'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const folders = await watchlistOps.getUserWatchlistFolders(user.id)
    
    // If user has no folders, create default ones
    if (folders.length === 0) {
      const defaultFolders = await watchlistOps.createDefaultFolders(user.id)
      return NextResponse.json({ folders: defaultFolders })
    }

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'createFolder': {
        const { name } = data
        if (!name || typeof name !== 'string') {
          return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
        }
        
        const folder = await watchlistOps.createFolder(user.id, name)
        return NextResponse.json({ folder })
      }

      case 'deleteFolder': {
        const { folderId } = data
        if (!folderId) {
          return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
        }
        
        await watchlistOps.deleteFolder(user.id, folderId)
        return NextResponse.json({ success: true })
      }

      case 'renameFolder': {
        const { folderId, name } = data
        if (!folderId || !name) {
          return NextResponse.json({ error: 'Folder ID and name are required' }, { status: 400 })
        }
        
        const folder = await watchlistOps.renameFolder(user.id, folderId, name)
        return NextResponse.json({ folder })
      }

      case 'toggleFolder': {
        const { folderId } = data
        if (!folderId) {
          return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
        }
        
        const folder = await watchlistOps.toggleFolder(user.id, folderId)
        return NextResponse.json({ folder })
      }

      case 'addItem': {
        const { folderId, ticker, company, logo } = data
        if (!folderId || !ticker) {
          return NextResponse.json({ error: 'Folder ID and ticker are required' }, { status: 400 })
        }
        
        const item = await watchlistOps.addItemToFolder(user.id, folderId, { ticker, company, logo })
        return NextResponse.json({ item })
      }

      case 'removeItem': {
        const { folderId, itemId } = data
        if (!folderId || !itemId) {
          return NextResponse.json({ error: 'Folder ID and item ID are required' }, { status: 400 })
        }
        
        await watchlistOps.removeItemFromFolder(user.id, folderId, itemId)
        return NextResponse.json({ success: true })
      }

      case 'moveItem': {
        const { fromFolderId, toFolderId, itemId } = data
        if (!fromFolderId || !toFolderId || !itemId) {
          return NextResponse.json({ error: 'From folder ID, to folder ID, and item ID are required' }, { status: 400 })
        }
        
        const item = await watchlistOps.moveItemBetweenFolders(user.id, fromFolderId, toFolderId, itemId)
        return NextResponse.json({ item })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating watchlist:', error)
    
    // Handle specific errors with proper type checking
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('already in this folder')) {
      return NextResponse.json({ error: errorMessage }, { status: 409 })
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    )
  }
}