import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, FoodItem, User } from '../types';
import { Leaf, IndianRupee, Share2, Utensils, Bell, ArrowUp, Plus, Camera, Heart, BookOpen, MapPin, BarChart3, ChevronRight, HeartHandshake, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { ALL_BADGES } from './Badges';
import { MOCK_LEADERBOARD_DATA } from './Leaderboard';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  inventory: FoodItem[];
}

const MOTIVATIONAL_QUOTES = [
  "Every meal saved is a win for the planet. 🌍",
  "Small steps lead to big environmental changes. 🌱",
  "Food rescue: The easiest way to fight climate change. 🥗",
  "Your table, zero waste, infinite impact. ✨",
  "Love food, hate waste. 💚",
  "Sustainability starts in your kitchen. 🏠",
  "Reduce, reuse, and rescue. 🔄",
  "Waste-free living looks great on you! 😎",
  "You are making a real difference today. 🌟",
  "Nature thanks you for every bite saved. 🌲"
];

const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
      
      if (progress < duration) {
        const timeRatio = progress / duration;
        const easedProgress = easeOutCubic(timeRatio);
        setCount(easedProgress * value);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

// Internal Confetti Component
const ConfettiRain = () => (
  <div className="fixed inset-0 pointer-events-none z-[3000] overflow-hidden">
    {[...Array(60)].map((_, i) => (
      <div 
        key={i}
        className="absolute w-2 h-2 rounded-full animate-confetti-dashboard"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-5%`,
          backgroundColor: ['#00796B', '#F57C00', '#D32F2F', '#FFD700', '#EC4899'][i % 5],
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1.5 + Math.random() * 2.5}s`
        }}
      />
    ))}
    <style>{`
      @keyframes confetti-dashboard {
        0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
        25% { transform: translateY(25vh) rotate(90deg) translateX(15px); }
        50% { transform: translateY(50vh) rotate(180deg) translateX(-15px); }
        75% { transform: translateY(75vh) rotate(270deg) translateX(10px); }
        100% { transform: translateY(110vh) rotate(360deg) translateX(0); opacity: 0; }
      }
      .animate-confetti-dashboard { animation-name: confetti-dashboard; animation-timing-function: ease-in; animation-fill-mode: forwards; }
    `}</style>
  </div>
);

type StatKey = 'mealsSaved' | 'co2Prevented' | 'moneySaved' | 'donationsMade';

const Dashboard: React.FC<DashboardProps> = ({ user, stats, inventory }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // States for interactive feedback and motivation
  const [appreciationMsg, setAppreciationMsg] = useState<string | null>(null);
  const [msgStyles, setMsgStyles] = useState({ 
    text: 'text-[#00796B]', 
    bg: 'bg-teal-50 dark:bg-teal-900/30', 
    border: 'border-teal-100 dark:border-teal-800',
    headerText: 'text-[#00796B] dark:text-teal-400' // Quote color
  });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Motivational Quote State
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

  // Interval for motivational quotes (Every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteFade(true);
      }, 500); // Small delay for transition
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const expiringItems = inventory
    .filter(item => item.status === 'active')
    .map(item => {
        const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return { ...item, daysLeft: days };
    })
    .filter(item => item.daysLeft <= 4)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);
    
  const earnedBadgeObjects = ALL_BADGES.filter(b => stats.earnedBadges.includes(b.id));

  const leaderboardWidgetData = useMemo(() => {
    const currentUserEntry = {
        id: 'current-user',
        name: user?.name || 'You',
        meals: stats.mealsSaved,
        xp: stats.xp,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`,
        isCurrentUser: true,
        rank: 0
    };
    const all = [...MOCK_LEADERBOARD_DATA, currentUserEntry].sort((a, b) => b.xp - a.xp);
    const ranked = all.map((u, i) => ({ ...u, rank: i + 1 }));
    return ranked.slice(0, 3);
  }, [user, stats]);

  const handleQuickAction = (path: string, state?: any) => {
      navigate(path, { state });
  };

  const handleStatClick = (key: StatKey) => {
    const messages: Record<StatKey, string> = {
      mealsSaved: "Incredible! You're nourishing the community . 🥗",
      co2Prevented: "Planet Hero! Your efforts are helping our Earth breathe easier. 🌍",
      moneySaved: "Smart Choice! Every Rupee saved is a victory for your wallet and the world. 💰",
      donationsMade: "Heart of Gold! Your generosity is changing lives every single day. ❤️"
    };

    const styles: Record<StatKey, any> = {
      mealsSaved: { text: 'text-[#00796B]', bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-100 dark:border-teal-800', headerText: 'text-[#00796B]' },
      co2Prevented: { text: 'text-[#43A047]', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-100 dark:border-green-800', headerText: 'text-[#43A047]' },
      moneySaved: { text: 'text-[#EF6C00]', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-100 dark:border-orange-800', headerText: 'text-[#EF6C00]' },
      donationsMade: { text: 'text-[#D81B60]', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-100 dark:border-pink-800', headerText: 'text-[#D81B60]' }
    };

    setAppreciationMsg(messages[key]);
    setMsgStyles(styles[key]);
    setShowConfetti(true);

    setTimeout(() => {
      setAppreciationMsg(null);
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col pt-5 md:pt-0 px-0 gap-6 animate-fade-in relative">
      {showConfetti && <ConfettiRain />}

      {/* Header Summary Section */}
      <div className="flex flex-wrap justify-between items-start gap-4 mt-2">
          <div className="flex-1 min-w-[280px]">
            <h2 className="font-bold text-[32px] md:text-[40px] text-[#212121] dark:text-white leading-[1.2] mb-[8px]">
                {t('dashboard.welcome')}<br />{user?.name?.split(' ')[0] || 'Chef'} 👋
            </h2>
            
            {/* Constant Motivational Green Text (Cycles every 10s) - Increased Size */}
            <div className={`flex items-center gap-3 font-bold transition-all duration-500 transform ${quoteFade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} ${msgStyles.headerText} text-[16px] md:text-[22px] leading-snug`}>
               <Sparkles size={24} fill="currentColor" className="animate-pulse shrink-0" />
               <span>{MOTIVATIONAL_QUOTES[quoteIndex]}</span>
            </div>
            
            {/* Interactive Appreciation Bubble */}
            <div className={`h-10 mt-4 transition-all duration-500 transform overflow-hidden ${appreciationMsg ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
               <div className={`inline-flex items-center gap-2 ${msgStyles.bg} ${msgStyles.text} px-4 py-2 rounded-2xl text-xs font-bold shadow-sm border ${msgStyles.border} backdrop-blur-sm`}>
                  <Sparkles size={14} className="animate-pulse" />
                  {appreciationMsg}
               </div>
            </div>
          </div>
          <button 
            onClick={() => handleQuickAction('/inventory', { action: 'add' })}
            className="bg-[#00796B] hover:bg-[#00695C] text-white font-bold text-[16px] px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 active:scale-[0.98] hover:scale-[1.02] transition-all min-h-[52px] whitespace-nowrap flex items-center justify-center gap-2 border border-teal-600/20 group"
          >
            <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" /> {t('dashboard.addFood')}
          </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
        {[
          { icon: Utensils, key: 'mealsSaved' as StatKey, labelKey: 'dashboard.stats.mealsSaved', value: stats.mealsSaved, color: 'bg-[#00796B]', prefix: '', suffix: '', decimals: 0 },
          { icon: Leaf, key: 'co2Prevented' as StatKey, labelKey: 'dashboard.stats.co2Prevented', value: stats.co2Saved, color: 'bg-[#43A047]', prefix: '', suffix: ' kg', decimals: 1 },
          { icon: IndianRupee, key: 'moneySaved' as StatKey, labelKey: 'dashboard.stats.moneySaved', value: stats.moneySaved, color: 'bg-[#EF6C00]', prefix: '₹', suffix: '', decimals: 0 },
          { icon: HeartHandshake, key: 'donationsMade' as StatKey, labelKey: 'dashboard.stats.donationsMade', value: stats.donationsCompleted, color: 'bg-[#D81B60]', prefix: '', suffix: '', decimals: 0 }
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={() => handleStatClick(stat.key)}
            className="text-left glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[120px] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden relative active:scale-[0.98]"
          >
            <div className={`w-[48px] h-[48px] rounded-full ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <stat.icon size={24} color="white" />
            </div>
            <div>
                <div className="font-bold text-[24px] text-[#212121] dark:text-white mt-[12px]">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="font-normal text-[14px] text-[#757575] dark:text-slate-400 mt-1">{t(stat.labelKey)}</div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-xl text-[#212121] dark:text-white mb-4">{t('dashboard.quickActions')}</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
                { icon: Plus, color: '#00796B', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', titleKey: 'dashboard.quick.addItem', path: '/inventory', state: { action: 'add' } },
                { icon: Camera, color: '#0288D1', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', titleKey: 'dashboard.quick.scanFood', path: '/inventory', state: { action: 'scan' } },
                { icon: Heart, color: '#D32F2F', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', titleKey: 'dashboard.quick.donate', path: '/donate' },
                { icon: BookOpen, color: '#E65100', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', titleKey: 'dashboard.quick.recipes', path: '/recipes' },
                { icon: MapPin, color: '#7B1FA2', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', titleKey: 'dashboard.quick.findNgos', path: '/ngos' },
                { icon: BarChart3, color: '#455A64', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', titleKey: 'dashboard.quick.analytics', path: '/analytics' }
            ].map((action, i) => (
                <button 
                    key={i}
                    onClick={() => handleQuickAction(action.path, action.state)}
                    className="glass-card relative h-[110px] rounded-2xl flex flex-col items-center justify-center p-2 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] group border border-white/40 dark:border-white/10"
                >
                    <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-all duration-300">
                        <action.icon size={24} strokeWidth={2.5} style={{ color: action.color }} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight text-center">
                        {t(action.titleKey)}
                    </span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 md:pb-8">
          <div>
            <div className="flex justify-between items-baseline mb-3">
                <h3 className="font-bold text-xl text-[#212121] dark:text-white">{t('dashboard.expiringSoon')}</h3>
                <button onClick={() => navigate('/inventory')} className="text-[#00796B] text-[14px] font-medium hover:underline hover:scale-105 transition-transform active:scale-95">{t('dashboard.viewAll')}</button>
            </div>
            <div className="flex flex-col gap-3">
                {expiringItems.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center border border-white/40 dark:border-white/10">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.noExpiring')}</p>
                    </div>
                ) : (
                    expiringItems.map(item => {
                        const isExpired = item.daysLeft < 0;
                        return (
                            <button
                                key={item.id}
                                className="w-full text-left glass-card rounded-2xl p-4 flex items-center hover:bg-white/80 dark:hover:bg-white/5 hover:shadow-md transition-all group active:scale-[0.99] border border-white/40 dark:border-white/10" 
                                onClick={() => navigate('/inventory')}
                            >
                                <div className={`w-12 h-12 rounded-xl mr-3 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isExpired ? 'bg-red-100/80 dark:bg-red-900/30' : 'bg-amber-100/80 dark:bg-amber-900/30'}`}>
                                    {isExpired ? '⚠️' : '🕒'}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-[16px] text-[#212121] dark:text-slate-100">{item.name}</div>
                                    <span className={`${isExpired ? 'text-[#D32F2F]' : 'text-[#C2410C]'} text-[12px] font-medium`}>
                                        {isExpired ? t('dashboard.expired') : t('dashboard.expiresInDays', { days: item.daysLeft })}
                                    </span>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        );
                    })
                )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-xl text-[#212121] dark:text-white mb-3">{t('dashboard.leaderboardTitle')}</h3>
                <div className="flex flex-col gap-3">
                    {leaderboardWidgetData.map((leader, i) => (
                        <div key={i} className={`flex items-center p-3 rounded-2xl transition-all cursor-pointer glass-card hover:bg-white/80 dark:hover:bg-white/10 group border ${leader.isCurrentUser ? 'border-[#00796B]/30 bg-[#00796B]/10' : 'border-white/40 dark:border-white/10'}`}>
                            <div className="w-6 font-black text-sm text-slate-500 dark:text-slate-400 text-center">{leader.rank}</div>
                            <img src={leader.avatar} alt={leader.name} className="w-9 h-9 rounded-full mx-3 bg-slate-200/80 dark:bg-slate-700/80 border border-white/50 dark:border-white/10 shadow-sm" />
                            <div className="flex-1 font-bold text-[14px] dark:text-white group-hover:text-[#00796B] transition-colors">{leader.name} {leader.isCurrentUser && t('dashboard.leaderboardYou')}</div>
                            <div className="font-black text-[14px] text-[#00796B]">{leader.xp.toLocaleString()}</div>
                        </div>
                    ))}
                    <button onClick={() => navigate('/leaderboard')} className="text-center text-sm font-bold text-[#00796B] mt-2 flex items-center justify-center gap-1 hover:gap-3 transition-all hover:underline active:scale-95">
                      {t('dashboard.leaderboardFull')} <ChevronRight size={16} />
                    </button>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
