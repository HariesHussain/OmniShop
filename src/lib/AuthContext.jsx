import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { getUser, createUserProfile, updateUserProfile } from '@/services/firestoreService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        let unsubscribeProfile = null;

        // Listen for auth state changes
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // Clean up existing profile listener if any
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            try {
                if (firebaseUser) {
                    // User is signed in, set up real-time listener for their profile
                    unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
                        if (docSnap.exists()) {
                            const profileData = docSnap.data();
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                ...profileData,
                            });
                            setIsAuthenticated(true);
                        } else {
                            // User doesn't have a Firestore profile yet (fresh registration)
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                            });
                            setIsAuthenticated(true);
                        }
                        setIsLoadingAuth(false);
                        setAuthChecked(true);
                        setAuthError(null);
                    }, (error) => {
                        console.error('Profile listener error:', error);
                        setAuthError({
                            type: 'profile_load_error',
                            message: 'Failed to sync user profile',
                        });
                        setIsLoadingAuth(false);
                        setAuthChecked(true);
                    });
                } else {
                    // User is signed out
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
                setAuthError({
                    type: 'profile_load_error',
                    message: 'Failed to load user profile',
                });
                setIsLoadingAuth(false);
                setAuthChecked(true);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const register = async (email, password, fullName) => {
        try {
            setAuthError(null);
            // Create user in Firebase Auth
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = result.user;

            // Send email verification
            await sendEmailVerification(newUser);

            // Create user profile in Firestore
            await createUserProfile(newUser.uid, {
                email: newUser.email,
                full_name: fullName,
                role: 'user',
            });

            // Update local user state
            setUser({
                uid: newUser.uid,
                email: newUser.email,
                full_name: fullName,
                role: 'user',
            });
            setIsAuthenticated(true);

            return newUser;
        } catch (error) {
            const errorMessage = error.code === 'auth/email-already-in-use'
                ? 'Email already registered'
                : error.message || 'Registration failed';

            setAuthError({
                type: 'registration_error',
                message: errorMessage,
            });
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            setAuthError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            const errorMessage = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
                ? 'Invalid email or password'
                : error.message || 'Login failed';

            setAuthError({
                type: 'login_error',
                message: errorMessage,
            });
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            setAuthError(null);
            const provider = new GoogleAuthProvider();
            
            const result = await signInWithPopup(auth, provider);
            const newUser = result.user;

            // Check if user profile exists, if not create it
            const existingProfile = await getUser(newUser.uid);
            if (!existingProfile) {
                await createUserProfile(newUser.uid, {
                    email: newUser.email,
                    full_name: newUser.displayName || 'Google User',
                    role: 'user',
                });
            }

            return newUser;
        } catch (error) {
            setAuthError({
                type: 'google_login_error',
                message: error.message || 'Google login failed',
            });
            throw error;
        }
    };

    const logout = async () => {
        try {
            setAuthError(null);
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            setAuthError({
                type: 'logout_error',
                message: error.message || 'Logout failed',
            });
            throw error;
        }
    };

    const updateProfile = async (data) => {
        try {
            setAuthError(null);
            if (!user || !user.uid) {
                throw new Error('No authenticated user');
            }

            await updateUserProfile(user.uid, data);

            // Re-fetch the full profile to ensure consistency (especially for role changes)
            const updatedProfile = await getUser(user.uid);

            // Update local user state
            setUser({
                uid: user.uid,
                email: user.email,
                ...updatedProfile,
            });

            return user;
        } catch (error) {
            setAuthError({
                type: 'profile_update_error',
                message: error.message || 'Profile update failed',
            });
            throw error;
        }
    };

    const resetPassword = async (email) => {
        try {
            setAuthError(null);
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            const errorMessage = error.code === 'auth/user-not-found'
                ? 'Email not found'
                : error.message || 'Password reset failed';

            setAuthError({
                type: 'password_reset_error',
                message: errorMessage,
            });
            throw error;
        }
    };

    const clearAuthError = () => {
        setAuthError(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            authChecked,
            register,
            login,
            loginWithGoogle,
            logout,
            updateProfile,
            resetPassword,
            clearAuthError,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
