import {
  User as FirebaseUser,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { AuthState, User } from '../types';

type AuthCallback = (state: AuthState) => void;

const subscribers = new Set<AuthCallback>();

const notifySubscribers = (state: AuthState) => {
  subscribers.forEach((cb) => cb(state));
};

const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || firebaseUser.email || 'SaveBite User',
  avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
});

const DEMO_USER: User = {
  id: 'demo_user_id_fixed',
  name: 'Eco Chef',
  email: 'demo@ecotable.dev',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EcoChef',
};

const createAuthState = (user: User | null): AuthState => ({
  user,
  token: null,
  isAuthenticated: !!user,
});

const requireAuthInstance = () => {
  if (!auth) {
    throw new Error('Firebase is not configured correctly. Please check your API key and environment variables.');
  }
  return auth;
};

export const FirebaseAuthService = {
  init: (): AuthState => {
    return { user: null, token: null, isAuthenticated: false };
  },

  subscribe: (callback: AuthCallback) => {
    subscribers.add(callback);
    if (!auth) {
      console.error('Firebase auth instance not available. Skipping auth state subscription.');
      callback(createAuthState(null));
      return () => {
        subscribers.delete(callback);
      };
    }

    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = mapFirebaseUserToUser(firebaseUser);
        callback(createAuthState(user));
      } else {
        callback(createAuthState(null));
      }
    });

    return () => {
      subscribers.delete(callback);
      unsubscribeFirebase();
    };
  },

  signup: async (name: string, email: string, password: string): Promise<AuthState> => {
    const authInstance = requireAuthInstance();
    const cred = await createUserWithEmailAndPassword(authInstance, email, password);
    if (cred.user && name) {
      await updateProfile(cred.user, { displayName: name });
    }
    const user = mapFirebaseUserToUser(cred.user);
    const state = createAuthState(user);
    notifySubscribers(state);
    return state;
  },

  login: async (email: string, password: string): Promise<AuthState> => {
    if (email === DEMO_USER.email && password === 'password123') {
      const state = createAuthState(DEMO_USER);
      notifySubscribers(state);
      return state;
    }

    const authInstance = requireAuthInstance();
    const cred = await signInWithEmailAndPassword(authInstance, email, password);
    const user = mapFirebaseUserToUser(cred.user);
    const state = createAuthState(user);
    notifySubscribers(state);
    return state;
  },

  loginWithGoogle: async (): Promise<AuthState> => {
    const authInstance = requireAuthInstance();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(authInstance, provider);
    const user = mapFirebaseUserToUser(cred.user);
    const state = createAuthState(user);
    notifySubscribers(state);
    return state;
  },

  logout: async (): Promise<AuthState> => {
    const authInstance = requireAuthInstance();
    await signOut(authInstance);
    const state = createAuthState(null);
    notifySubscribers(state);
    return state;
  },
};

