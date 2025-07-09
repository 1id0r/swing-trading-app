// lib/auth.ts (Production-Ready with Better Error Handling)
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User,
    onAuthStateChanged,
    updateProfile
  } from 'firebase/auth'
  import { doc, setDoc, getDoc } from 'firebase/firestore'
  import { auth, db } from './firebase'
  
  export interface UserProfile {
    uid: string
    email: string
    displayName: string
    createdAt: Date
    updatedAt: Date
  }
  
  // Sign up with email and password
  export const signUp = async (email: string, password: string, displayName: string) => {
    try {
      console.log('🚀 Starting signup process...')
      console.log('📧 Email:', email)
      console.log('👤 Display name:', displayName)
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('✅ User created in Firebase Auth:', user.uid)
  
      // Update the user's display name
      await updateProfile(user, { displayName })
      console.log('✅ Display name updated in Firebase Auth')
  
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
  
      console.log('💾 Attempting to save user profile to Firestore...')
      
      try {
        await setDoc(doc(db, 'users', user.uid), userProfile)
        console.log('✅ User profile saved to Firestore successfully!')
        console.log('📄 Profile data:', userProfile)
      } catch (firestoreError: any) {
        console.error('⚠️ Failed to save to Firestore:', firestoreError)
        console.log('🔄 User still created in Auth, will retry profile creation on signin')
        // Don't throw error - user is still created in Auth
      }
  
      console.log('🎉 Signup completed successfully!')
      return { user, userProfile }
    } catch (error: any) {
      console.error('❌ Signup failed:', error)
      console.error('🔍 Error code:', error.code)
      console.error('📝 Error message:', error.message)
      
      // Provide user-friendly error messages
      let friendlyMessage = error.message
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'Password is too weak. Please choose a stronger password.'
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.'
      }
      
      throw new Error(friendlyMessage)
    }
  }
  
  // Sign in with email and password
  export const signIn = async (email: string, password: string) => {
    try {
      console.log('🚀 Starting signin process...')
      console.log('📧 Email:', email)
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('✅ User signed in to Firebase Auth:', user.uid)
      console.log('👤 Auth display name:', user.displayName)
      console.log('📧 Auth email:', user.email)
  
      // Try to get user profile from Firestore
      let userProfile: UserProfile | null = null
      
      console.log('🔍 Looking for user profile in Firestore...')
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          userProfile = userDoc.data() as UserProfile
          console.log('✅ User profile loaded from Firestore')
          console.log('📄 Profile data:', userProfile)
        } else {
          console.log('⚠️ No user profile found in Firestore, creating one...')
          
          // Create profile if it doesn't exist (for users who signed up when Firestore was offline)
          userProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'User', 
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          await setDoc(doc(db, 'users', user.uid), userProfile)
          console.log('✅ User profile created in Firestore')
        }
      } catch (firestoreError: any) {
        console.error('⚠️ Firestore error:', firestoreError)
        console.log('🔄 Using fallback profile from Auth data')
        
        // Create fallback profile from Auth data
        userProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
  
      console.log('🎉 Signin completed successfully!')
      return { user, userProfile }
    } catch (error: any) {
      console.error('❌ Signin failed:', error)
      console.error('🔍 Error code:', error.code)
      console.error('📝 Error message:', error.message)
      
      // Provide user-friendly error messages
      let friendlyMessage = error.message
      if (error.code === 'auth/user-not-found') {
        friendlyMessage = 'No account found with this email. Please sign up first.'
      } else if (error.code === 'auth/wrong-password') {
        friendlyMessage = 'Incorrect password. Please try again.'
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.'
      } else if (error.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed attempts. Please try again later.'
      }
      
      throw new Error(friendlyMessage)
    }
  }
  
  // Sign out
  export const signOutUser = async () => {
    try {
      console.log('🚪 Signing out user...')
      await signOut(auth)
      console.log('✅ User signed out successfully')
    } catch (error: any) {
      console.error('❌ Signout error:', error.message)
      throw new Error(error.message)
    }
  }
  
  // Get user profile from Firestore
  export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      console.log('🔍 Getting user profile for UID:', uid)
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile
        console.log('✅ User profile retrieved:', profile)
        return profile
      } else {
        console.log('⚠️ No user profile found for UID:', uid)
        return null
      }
    } catch (error: any) {
      console.error('❌ Error getting user profile:', error.message)
      return null
    }
  }
  
  // Auth state observer
  export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔄 Auth state changed: User signed in', user.uid)
      } else {
        console.log('🔄 Auth state changed: User signed out')
      }
      callback(user)
    })
  }