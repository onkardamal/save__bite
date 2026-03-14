
export enum FoodCategory {
  PRODUCE = 'Produce',
  DAIRY = 'Dairy',
  MEAT = 'Meat',
  GRAINS = 'Grains',
  BAKERY = 'Bakery',
  CANNED = 'Canned',
  OTHER = 'Other'
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  expiryDate: string; // ISO date string
  imageUrl?: string;
  status: 'active' | 'consumed' | 'donated' | 'wasted';
  condition?: string; // e.g. "Fresh", "Ripe", "Slightly Wilted"
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  savedItems: string[]; // Ingredient names from inventory used in this recipe
}

export interface NGO {
  id: string;
  name: string;
  distance: string;
  needs: FoodCategory[];
  rating: number;
  lat: number;
  lng: number;
  urgency?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/** Full handover details sent to the NGO (e.g. via email) so they know what to expect. */
export interface DonationHandoverSummary {
  ngoName: string;
  donorName: string;
  donorPhone: string;
  handoverDate: string;
  handoverTime: string;
  mode: 'dropoff' | 'pickup';
  items: { name: string; quantity: number; unit: string; expiryDate: string; condition?: string }[];
  notes: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  color: string;
  requirement: string;
}

export interface Review {
  rating: number;
  tags: string[];
  comment?: string;
}

export interface DonationHistoryItem {
  id: string;
  foodName: string;
  date: string;
  ngoName: string;
  status: 'completed' | 'pending';
  points: number;
  review?: Review;
}

export interface UserStats {
  mealsSaved: number;
  co2Saved: number; // in kg
  moneySaved: number; // in USD (displayed in Rupees)
  donationsCompleted: number; // total count of donation events
  streakDays: number;
  level: number;
  xp: number;
  earnedBadges: string[]; // IDs of earned badges
  history: DonationHistoryItem[];
}

export interface ScanResult {
  name: string;
  category: string;
  expiryEstimation: string; // "YYYY-MM-DD"
  quantityEstimation: number;
  unitEstimation: string;
  condition: string; // e.g. "Fresh", "Ripe", "Slightly Wilted"
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  /** Optional FSSAI certification ID; when set, user is shown as verified */
  fssaiId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Global declaration for Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}
