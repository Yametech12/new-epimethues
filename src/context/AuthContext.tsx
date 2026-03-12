import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

// Force prompt to select account every time for better UX
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string, photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_EMAIL = "oraclemaster41@gmail.com";

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const isEmailAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAdmin(isEmailAdmin);
        try {
          // Fetch additional user data from Firestore (like base64 photoURL)
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin') {
              setIsAdmin(true);
            }
            if (data.photoURL) {
              // Merge Firestore photoURL into the user object
              Object.defineProperty(currentUser, 'photoURL', {
                value: data.photoURL,
                writable: true,
                configurable: true
              });
            }
          } else {
            // Create the user document if it doesn't exist
            try {
              await setDoc(doc(db, 'users', currentUser.uid), {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role: isEmailAdmin ? 'admin' : 'user',
                createdAt: new Date()
              });
            } catch (err) {
              if (err instanceof Error && err.message.includes('offline')) {
                console.warn("Firestore is offline. Could not create user document.");
              } else {
                handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('offline')) {
            console.warn("Firestore is offline. Could not fetch user document.");
          } else if (error instanceof Error && error.message.includes('operationType')) {
            throw error;
          } else {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    // Safety timeout to prevent infinite loading screens
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const updateUserProfile = async (data: { displayName?: string, photoURL?: string }) => {
    if (user) {
      // Only call Firebase updateProfile if it's not a massive base64 string
      // Firebase Auth has a strict limit on photoURL length
      if (!data.photoURL || !data.photoURL.startsWith('data:image/')) {
        await updateProfile(user, data);
      }
      
      const updatedUser = { ...user, ...data } as User;
      setUser(updatedUser);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        return; // User intentionally closed the popup
      }
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // Force a state update with the new display name
        setUser({ ...userCredential.user, displayName: name } as User);
      }
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
