'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  dbUserId: string | null
  logout: () => Promise<void>
  getAuthHeaders: () => Promise<{ [key: string]: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email || 'null')

      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Get or create user in database using Firebase ID token
          const idToken = await firebaseUser.getIdToken()

          const response = await fetch('/api/auth/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          })

          if (response.ok) {
            const { user: dbUser } = await response.json()
            setDbUserId(dbUser.id)

            // Persist to localStorage for page refreshes
            localStorage.setItem('dbUserId', dbUser.id)

            console.log('✅ Database user set:', dbUser.id)
          } else {
            throw new Error('Failed to get/create database user')
          }
        } catch (error) {
          console.error('❌ Database user error:', error)
          setDbUserId(null)
          localStorage.removeItem('dbUserId')
        }
      } else {
        // User signed out
        setDbUserId(null)
        localStorage.removeItem('dbUserId')
      }

      setLoading(false)
    })

    // On app load, try to restore dbUserId from localStorage
    const savedDbUserId = localStorage.getItem('dbUserId')
    if (savedDbUserId && !dbUserId) {
      setDbUserId(savedDbUserId)
    }

    return unsubscribe
  }, [])

  const getAuthHeaders = async (): Promise<{ [key: string]: string }> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const idToken = await user.getIdToken()

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setDbUserId(null)
      localStorage.removeItem('dbUserId')
      console.log('✅ User signed out')
    } catch (error) {
      console.error('❌ Logout failed:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, dbUserId, logout, getAuthHeaders }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
