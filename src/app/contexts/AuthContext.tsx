// Update your /src/app/contexts/AuthContext.tsx to handle profile photos
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  dbUserId: string | null
  logout: () => Promise<void>
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        '🔐 Auth state changed:',
        firebaseUser
          ? {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }
          : null
      )

      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Get or create user in database
          const dbUser = await getOrCreateDatabaseUser(firebaseUser)
          setDbUserId(dbUser.id)
          console.log('✅ Database user set:', dbUser.id)
        } catch (error) {
          console.error('❌ Failed to get/create database user:', error)
          setDbUserId(null)
        }
      } else {
        setDbUserId(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getOrCreateDatabaseUser = async (firebaseUser: User) => {
    try {
      // First, try to get existing user
      const response = await fetch('/api/auth/get-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
        }),
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('👤 Found existing user:', userData)
        return userData.user
      }

      // If user doesn't exist, create new one
      console.log('👤 Creating new user in database...')
      const createResponse = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL,
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create user: ${createResponse.status}`)
      }

      const newUserData = await createResponse.json()
      console.log('✅ Created new user:', newUserData)
      return newUserData.user
    } catch (error) {
      console.error('❌ Error getting/creating database user:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setDbUserId(null)
      console.log('✅ User signed out')
    } catch (error) {
      console.error('❌ Logout failed:', error)
      throw error
    }
  }

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error('No user logged in')

    try {
      await updateProfile(user, updates)
      console.log('✅ Profile updated:', updates)

      // Optionally update in your database too
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          ...updates,
        }),
      })
    } catch (error) {
      console.error('❌ Failed to update profile:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    dbUserId,
    logout,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
