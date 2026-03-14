
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin, LogOut, Leaf, Moon, Sun, User as UserIcon, ShieldCheck } from 'lucide-react';
import { FoodItem, UserStats, Recipe, FoodCategory, AuthState, ThemeContextType, Theme, User, DonationHistoryItem } from './types';
import { FirebaseAuthService } from './services/firebaseAuth';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from './i18n';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Donation from './components/Donation';
import NGOMap from './components/NGOMap';
import Analytics from './components/Analytics';
import Badges from './components/Badges';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import { Login, Signup } from './components/Auth';

// --- Theme Context ---
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// --- MOCK DATA: For Demo User Only ---
const MOCK_INVENTORY: FoodItem[] = [
  { id: "m1", name: "Ground Beef Patty", category: FoodCategory.MEAT, quantity: 1, unit: "pcs", expiryDate: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'active', condition: 'Expired' },
  { id: "m2", name: "Tomato Slice", category: FoodCategory.PRODUCE, quantity: 4, unit: "pcs", expiryDate: new Date(Date.now() + 1 * 86400000).toISOString(), status: 'active', condition: 'Ripe' },
  { id: "m3", name: "Sesame Seed Buns", category: FoodCategory.BAKERY, quantity: 2, unit: "pcs", expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(), status: 'active', condition: 'Good' },
  { id: "m4", name: "Cheddar Cheese", category: FoodCategory.DAIRY, quantity: 1, unit: "pack", expiryDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'active', condition: 'Good' },
  { id: "m5", name: "Iceberg Lettuce", category: FoodCategory.PRODUCE, quantity: 1, unit: "head", expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'active', condition: 'Fresh' },
  { id: "m6", name: "Mayonnaise Jar", category: FoodCategory.OTHER, quantity: 1, unit: "jar", expiryDate: new Date(Date.now() + 60 * 86400000).toISOString(), status: 'active', condition: 'Good' }
];

const MOCK_STATS: UserStats = {
  mealsSaved: 145,
  co2Saved: 320.5,
  moneySaved: 4500,
  donationsCompleted: 24,
  streakDays: 12,
  level: 8,
  xp: 8450,
  earnedBadges: ['b1', 'b2', 'b3', 'b4'],
  history: [
    { id: 'h1', foodName: 'Bulk Potato Sacks (10kg)', date: 'Jan 15, 2:00 PM', ngoName: 'City Care Food Bank', status: 'completed', points: 500 },
    { id: 'h2', foodName: 'Organic Tomato Crate', date: 'Jan 22, 10:30 AM', ngoName: 'Helping Hands Shelter', status: 'completed', points: 350 }
  ]
};

// --- INITIAL STATES: For Genuine New Users ---
const EMPTY_STATS: UserStats = {
    mealsSaved: 0,
    co2Saved: 0,
    moneySaved: 0,
    donationsCompleted: 0,
    streakDays: 0,
    level: 1,
    xp: 0,
    earnedBadges: [],
    history: []
};

// Sidebar Component
const Sidebar = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language === 'hi' ? 'hi' : i18n.language === 'mr' ? 'mr' : 'en') as 'en' | 'hi' | 'mr';
  const navItems = [
    { path: '/', icon: Home, labelKey: 'nav.dashboard' },
    { path: '/inventory', icon: Package, labelKey: 'nav.inventory' },
    { path: '/recipes', icon: ChefHat, labelKey: 'nav.recipes' },
    { path: '/donate', icon: Heart, labelKey: 'nav.donate' },
    { path: '/ngos', icon: MapPin, labelKey: 'nav.ngos' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] fixed left-4 top-4 bottom-4 z-50 rounded-2xl glass-panel overflow-hidden transition-all duration-300">
      <div className="p-5 flex items-center gap-3 mb-4 group cursor-pointer" onClick={() => window.location.hash = '#/'}>
        <div className="w-10 h-10 bg-[#00796B] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"><Leaf size={20} fill="white" /></div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-[#212121] dark:text-slate-100 leading-none group-hover:text-[#00796B] transition-colors">{t('app.name')}</h1>
          <p className="text-[9px] text-[#757575] dark:text-slate-400 font-bold uppercase tracking-tighter mt-1 group-hover:translate-x-0.5 transition-transform">{t('app.tagline')}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-95 ${isActive ? 'bg-[#00796B]/15 text-[#00796B] font-semibold shadow-sm' : 'text-[#757575] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5'}`}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 transition-all duration-300 ${isActive ? 'text-[#00796B] scale-110' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200 group-hover:scale-110'}`} />
              <span className={`transition-colors duration-300 truncate ${isActive ? 'text-[#00796B]' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200'}`}>{t(item.labelKey as any)}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 space-y-1.5 border-t border-white/20 dark:border-white/5">
        <button onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#757575] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-95 transition-all w-full group">
          {theme === 'light' ? <Moon size={22} className="shrink-0 group-hover:rotate-[360deg] transition-transform duration-700" /> : <Sun size={22} className="shrink-0 group-hover:rotate-[360deg] transition-transform duration-700" />}
          <span className="group-hover:text-[#212121] dark:group-hover:text-white transition-colors">{theme === 'light' ? t('theme.dark') : t('theme.light')}</span>
        </button>
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 mb-1.5">
          <span className="text-xs font-semibold text-[#757575] dark:text-slate-400">Language</span>
          <div className="flex gap-0.5 rounded-lg overflow-hidden bg-white/50 dark:bg-white/5 p-0.5">
            <button type="button" onClick={() => changeLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${currentLang === 'en' ? 'bg-[#00796B] text-white shadow-sm' : 'text-[#757575] dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'}`}>{t('language.labelShortEn')}</button>
            <button type="button" onClick={() => changeLanguage('hi')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${currentLang === 'hi' ? 'bg-[#00796B] text-white shadow-sm' : 'text-[#757575] dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'}`}>{t('language.labelShortHi')}</button>
            <button type="button" onClick={() => changeLanguage('mr')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${currentLang === 'mr' ? 'bg-[#00796B] text-white shadow-sm' : 'text-[#757575] dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'}`}>{t('language.labelShortMr')}</button>
          </div>
        </div>
        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95 group border border-transparent hover:border-white/30 dark:hover:border-white/10">
          <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Profile" className="w-9 h-9 rounded-full bg-slate-200/80 dark:bg-slate-700/80 shadow-sm group-hover:ring-2 group-hover:ring-[#00796B] transition-all shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#212121] dark:text-white truncate group-hover:text-[#00796B] transition-colors flex items-center gap-1.5">
              {user?.name}
              {user?.fssaiId && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#00796B]/15 text-[#00796B] dark:bg-teal-500/20 dark:text-teal-400 text-[10px] font-bold shrink-0" title={t('profile.verifiedTooltip')}>
                  <ShieldCheck size={10} strokeWidth={2.5} /> {t('profile.verified')}
                </span>
              )}
            </p>
            <p className="text-xs text-[#757575] dark:text-slate-400 truncate">{t('nav.viewProfile')}</p>
          </div>
          <UserIcon size={16} className="text-slate-400 group-hover:text-[#00796B] transition-colors shrink-0" />
        </NavLink>
      </div>
    </aside>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const navItems = [
    { path: '/', icon: Home, labelKey: 'nav.dashboard' },
    { path: '/inventory', icon: Package, labelKey: 'nav.inventory' },
    { path: '/recipes', icon: ChefHat, labelKey: 'nav.recipes' },
    { path: '/donate', icon: Heart, labelKey: 'nav.donate' },
    { path: '/ngos', icon: MapPin, labelKey: 'nav.ngos' },
    { path: '/profile', icon: UserIcon, labelKey: 'nav.viewProfile' },
  ];

  return (
    <nav aria-label="Bottom navigation" className="md:hidden fixed left-4 right-4 bottom-4 z-[100] h-[72px] rounded-2xl glass-panel flex justify-around items-center px-2 pb-safe transition-all duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink key={item.path} to={item.path} aria-label={t(item.labelKey as any)} className="flex flex-col items-center justify-center flex-1 min-w-0 max-w-[64px] relative group active:scale-90 transition-all py-2">
            {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00796B] rounded-b-full shadow-[0_2px_8px_#00796B60]"></div>}
            <div className={`rounded-xl p-2 transition-all duration-300 ${isActive ? 'scale-110 bg-[#00796B]/15' : 'group-hover:scale-105'}`}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#00796B' : undefined} className={!isActive ? 'text-[#757575] dark:text-slate-500 group-hover:text-[#212121] dark:group-hover:text-white' : 'text-[#00796B]'} />
            </div>
            <span className={`text-[10px] font-medium mt-1 leading-none transition-all duration-300 ${isActive ? 'text-[#00796B] font-bold' : 'text-[#757575] dark:text-slate-500 group-hover:text-[#212121] dark:group-hover:text-white'}`}>{t(item.labelKey as any)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppContent = ({ auth, stats, inventory, recipes, handleLogout, handleAddItem, handleUpdateStatus, handleDeleteItem, handleEditItem, handleCookRecipe, handleUpdateRecipes, handleDonateComplete, handleUpdateStats }: any) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTo(0, 0); }, [location.pathname]);
  return (
    <div className="min-h-screen bg-[#F0F4F3] dark:bg-slate-950 font-sans text-[#212121] dark:text-slate-100 flex transition-colors duration-300">
      <Sidebar user={auth.user} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[272px] h-screen overflow-hidden md:pr-4 md:pt-4 md:pb-4">
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-[100px] md:pb-0 scroll-smooth rounded-t-2xl md:rounded-2xl overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm">
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard user={auth.user} stats={stats} inventory={inventory} />} />
              <Route path="/inventory" element={<Inventory items={inventory} onAddItem={handleAddItem} onUpdateStatus={handleUpdateStatus} onDeleteItem={handleDeleteItem} onEditItem={handleEditItem} />} />
              <Route path="/recipes" element={<Recipes inventory={inventory} recipes={recipes} onUpdateRecipes={handleUpdateRecipes} onCookRecipe={handleCookRecipe} />} />
              <Route path="/donate" element={<Donation user={auth.user} inventory={inventory} onDonateComplete={handleDonateComplete} />} />
              <Route path="/ngos" element={<NGOMap />} />
              <Route path="/analytics" element={<Analytics stats={stats} />} />
              <Route path="/badges" element={<Badges stats={stats} />} />
              <Route path="/leaderboard" element={<Leaderboard user={auth.user} stats={stats} />} />
              <Route path="/profile" element={<Profile user={auth.user} stats={stats} onLogout={handleLogout} onUpdateStats={handleUpdateStats} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState<AuthState>(FirebaseAuthService.init());
  const [isLoginView, setIsLoginView] = useState(true);
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const mergeFssaiIntoUser = (state: AuthState): AuthState => {
    if (!state.user?.id) return state;
    const fssaiId = localStorage.getItem(`savebite_fssai_${state.user.id}`);
    return { ...state, user: { ...state.user, fssaiId: fssaiId || undefined } };
  };

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.subscribe((state) => {
      setAuth(mergeFssaiIntoUser(state));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle initialization of profile specific data
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
        const key = `savebite_data_${auth.user.id}`;
        const storedData = localStorage.getItem(key);
        
        if (storedData) {
             try {
                 const parsed = JSON.parse(storedData);
                 setInventory(parsed.inventory || []);
                 setStats(parsed.stats || EMPTY_STATS);
             } catch (e) {
                 setInventory([]);
                 setStats(EMPTY_STATS);
             }
        } else {
             // NO DATA FOUND: First time login for this user
             if (auth.user.email === 'demo@ecotable.dev') {
                // MOCK DATA for Demo User
                setInventory(MOCK_INVENTORY);
                setStats(MOCK_STATS);
             } else {
                // GENUINE DATA (EMPTY) for real new users
                setInventory([]);
                setStats(EMPTY_STATS);
             }
        }
        setIsDataInitialized(true);
    } else {
        // If not authenticated, ensure states are reset
        setInventory([]);
        setStats(EMPTY_STATS);
        setIsDataInitialized(false);
    }
  }, [auth.isAuthenticated, auth.user?.id, auth.user?.email]);

  // Persist data on changes
  useEffect(() => {
    if (isDataInitialized && auth.isAuthenticated && auth.user?.id) {
        const key = `savebite_data_${auth.user.id}`;
        localStorage.setItem(key, JSON.stringify({ inventory, stats }));
    }
  }, [inventory, stats, auth.isAuthenticated, auth.user?.id, isDataInitialized]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleLogin = (state: AuthState) => setAuth(mergeFssaiIntoUser(state));
  const handleLogout = () => {
    FirebaseAuthService.logout().then(setAuth);
    // Force a clean state reset
    setInventory([]);
    setStats(EMPTY_STATS);
    setGeneratedRecipes([]);
    setIsDataInitialized(false);
    // Simple redirect to home
    window.location.hash = '#/';
  };

  const handleAddItem = (item: FoodItem) => setInventory(prev => [item, ...prev]);
  const handleDeleteItem = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));
  const handleEditItem = (updatedItem: FoodItem) => setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  
  const handleUpdateStatus = (id: string, status: 'donated' | 'wasted' | 'consumed') => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    if (status === 'donated') {
      setStats(prev => ({ ...prev, mealsSaved: prev.mealsSaved + 1, donationsCompleted: (prev.donationsCompleted || 0) + 1, co2Saved: parseFloat((prev.co2Saved + 0.5).toFixed(1)), moneySaved: prev.moneySaved + 5, xp: prev.xp + 50 }));
    }
  };

  const handleCookRecipe = (recipe: Recipe) => {
    setInventory(prev => prev.map(item => {
      const isUsed = recipe.ingredients.some(ing => ing.toLowerCase().includes(item.name.toLowerCase()));
      return isUsed && item.status === 'active' ? { ...item, status: 'consumed' } : item;
    }));
    setStats(prev => ({ ...prev, mealsSaved: prev.mealsSaved + 1, co2Saved: parseFloat((prev.co2Saved + 0.8).toFixed(1)), moneySaved: prev.moneySaved + 10, xp: prev.xp + 100 }));
  };

  const handleDonateComplete = (itemIds: string[], amount: number) => {
    setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status: 'donated' } : item));
    setStats(prev => ({ 
      ...prev, 
      mealsSaved: prev.mealsSaved + itemIds.length, 
      donationsCompleted: (prev.donationsCompleted || 0) + 1, 
      moneySaved: prev.moneySaved + amount, 
      co2Saved: parseFloat((prev.co2Saved + (itemIds.length * 0.5)).toFixed(1)), 
      xp: prev.xp + (itemIds.length * 50) 
    }));
  };

  const handleUpdateStats = (newStats: UserStats) => setStats(newStats);

  if (!auth.isAuthenticated) {
    return isLoginView ? (
      <Login
        onLogin={handleLogin}
        onToggle={() => setIsLoginView(false)}
        onEmailPasswordLogin={(email, password) => FirebaseAuthService.login(email, password)}
        onEmailPasswordSignup={(name, email, password) => FirebaseAuthService.signup(name, email, password)}
        onGoogleLogin={() => FirebaseAuthService.loginWithGoogle()}
      />
    ) : (
      <Signup
        onLogin={handleLogin}
        onToggle={() => setIsLoginView(true)}
        onEmailPasswordLogin={(email, password) => FirebaseAuthService.login(email, password)}
        onEmailPasswordSignup={(name, email, password) => FirebaseAuthService.signup(name, email, password)}
        onGoogleLogin={() => FirebaseAuthService.loginWithGoogle()}
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HashRouter>
        <AppContent auth={auth} stats={stats} inventory={inventory} recipes={generatedRecipes} handleLogout={handleLogout} handleAddItem={handleAddItem} handleDeleteItem={handleDeleteItem} handleUpdateStatus={handleUpdateStatus} handleEditItem={handleEditItem} handleCookRecipe={handleCookRecipe} handleUpdateRecipes={setGeneratedRecipes} handleDonateComplete={handleDonateComplete} handleUpdateStats={handleUpdateStats} />
      </HashRouter>
    </ThemeContext.Provider>
  );
}
