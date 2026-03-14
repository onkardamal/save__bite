import { User, AuthState } from '../types';

// Mock Backend Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const USERS_KEY = 'savebite_users';
const SESSION_KEY = 'savebite_session';
const GOOGLE_MOCKS_KEY = 'savebite_google_mocks';
const DELETED_IDS_KEY = 'savebite_deleted_ids';

const DEFAULT_GOOGLE_MOCKS = [
  { id: 'google_1', name: 'Alex Rivera', email: 'alex.rivera@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'google_2', name: 'Jamie Taylor', email: 'jamie.t@work.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie' }
];

type AuthCallback = (state: AuthState) => void;
const subscribers = new Set<AuthCallback>();

const notifySubscribers = (state: AuthState) => {
  subscribers.forEach(callback => callback(state));
};

export const AuthService = {
  init: (): AuthState => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    return { user: null, token: null, isAuthenticated: false };
  },

  subscribe: (callback: AuthCallback) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },

  getMockGoogleAccounts: () => {
    const stored = localStorage.getItem(GOOGLE_MOCKS_KEY);
    let accounts = stored ? JSON.parse(stored) : [...DEFAULT_GOOGLE_MOCKS];
    
    // Filter out any IDs that were explicitly deleted
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
    accounts = accounts.filter((acc: any) => !deletedIds.includes(acc.id));
    
    return accounts;
  },

  // Helper to ensure an account is visible in the mock picker
  syncToMockPicker: (user: User) => {
    const stored = localStorage.getItem(GOOGLE_MOCKS_KEY);
    let accounts = stored ? JSON.parse(stored) : [...DEFAULT_GOOGLE_MOCKS];
    
    // Check if already in list
    const exists = accounts.find((acc: any) => acc.id === user.id || acc.email === user.email);
    if (!exists) {
        accounts.push(user);
        localStorage.setItem(GOOGLE_MOCKS_KEY, JSON.stringify(accounts));
    }
  },

  isDemoDeleted: () => {
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
    return deletedIds.includes('demo_user_id_fixed');
  },

  signup: async (name: string, email: string, password: string): Promise<AuthState> => {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    users.push({ ...newUser, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Register this account in the mock picker for next time
    AuthService.syncToMockPicker(newUser);

    const authState = { user: newUser, token: 'jwt-' + Date.now(), isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authState));
    
    notifySubscribers(authState);
    return authState;
  },

  login: async (email: string, password: string): Promise<AuthState> => {
    await delay(800);
    
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
    
    // Demo account logic
    if (email === 'demo@ecotable.dev' && password === 'password123') {
        if (deletedIds.includes('demo_user_id_fixed')) {
            throw new Error('This account has been deleted.');
        }
        const demoUser: User = {
            id: 'demo_user_id_fixed',
            name: 'Eco Chef',
            email: 'demo@ecotable.dev',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EcoChef'
        };
        
        AuthService.syncToMockPicker(demoUser);
        
        const authState = { user: demoUser, token: 'demo-token', isAuthenticated: true };
        localStorage.setItem(SESSION_KEY, JSON.stringify(authState));
        notifySubscribers(authState);
        return authState;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user || deletedIds.includes(user.id)) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...safeUser } = user;
    
    // Ensure this account shows up in the mock picker too
    AuthService.syncToMockPicker(safeUser);

    const authState = { user: safeUser, token: 'jwt-' + Date.now(), isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authState));

    notifySubscribers(authState);
    return authState;
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    const authState = { user: null, token: null, isAuthenticated: false };
    notifySubscribers(authState);
    return authState;
  },

  deleteAccount: async (userId: string) => {
    await delay(1000);
    
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
    if (!deletedIds.includes(userId)) {
        deletedIds.push(userId);
        localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const filteredUsers = users.filter((u: any) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));

    const googleMocks = JSON.parse(localStorage.getItem(GOOGLE_MOCKS_KEY) || '[]');
    const filteredMocks = googleMocks.filter((u: any) => u.id !== userId);
    localStorage.setItem(GOOGLE_MOCKS_KEY, JSON.stringify(filteredMocks));

    localStorage.removeItem(`savebite_data_${userId}`);

    await AuthService.logout();
  }
};