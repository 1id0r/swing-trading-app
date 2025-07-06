// lib/auth.ts
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
  
      // Update the user's display name
      await updateProfile(user, { displayName })
  
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
  
      await setDoc(doc(db, 'users', user.uid), userProfile)
  
      return { user, userProfile }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
  
  // Sign in with email and password
  export const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
  
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userProfile = userDoc.data() as UserProfile
  
      return { user, userProfile }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
  
  // Sign out
  export const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
  
  // Get user profile from Firestore
  export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile
      }
      return null
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }
  
  // Auth state observer
  export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
  }