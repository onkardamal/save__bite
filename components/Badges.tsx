import React from 'react';
import { UserStats, Badge } from '../types';
import { ArrowLeft, Trophy, Star, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define available badges
export const ALL_BADGES: Badge[] = [
  { id: 'b1', name: 'Zero Waste Hero', description: 'Save your first meal', icon: '🌱', color: '#4CAF50', requirement: 'Save 1 meal' },
  { id: 'b2', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', color: '#FF9800', requirement: '7 day streak' },
  { id: 'b3', name: 'Community Star', description: 'Make 5 donations', icon: '🤝', color: '#2196F3', requirement: '5 donations' },
  { id: 'b4', name: 'Planet Saver', description: 'Prevent 50kg of CO2', icon: '🌍', color: '#00BCD4', requirement: '50kg CO2 saved' },
  { id: 'b5', name: 'Top Chef', description: 'Cook 10 generated recipes', icon: '👨‍🍳', color: '#9C27B0', requirement: '10 recipes cooked' },
  { id: 'b6', name: 'Early Bird', description: 'Log food before 9 AM', icon: '🌅', color: '#FFC107', requirement: 'Log item < 9am' },
  { id: 'b7', name: 'Bulk Saver', description: 'Save 20 items in a month', icon: '📦', color: '#795548', requirement: '20 items saved' },
  { id: 'b8', name: 'Local Hero', description: 'Visit 3 different NGOs', icon: '🗺️', color: '#E91E63', requirement: '3 NGOs visited' },
];

interface BadgesProps {
  stats: UserStats;
}

const Badges: React.FC<BadgesProps> = ({ stats }) => {
  const navigate = useNavigate();

  // Calculate Level Progress
  const currentLevelXp = 1000 * stats.level;
  const nextLevelXp = 1000 * (stats.level + 1);
  const progressPercent = Math.min(100, Math.max(0, ((stats.xp - (currentLevelXp - 1000)) / 1000) * 100));

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 pb-24 md:pb-8 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="pt-4 px-4 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm mb-4 flex items-center gap-3 rounded-b-2xl">
        <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back"
        >
            <ArrowLeft size={24} className="text-[#212121] dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-[#212121] dark:text-white">Achievements</h1>
      </header>

      <div className="px-4 max-w-4xl mx-auto">
        {/* Level Card */}
        <div className="bg-gradient-to-r from-[#00796B] to-[#00695C] rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
             <div className="relative z-10 flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 text-3xl shadow-inner">
                    🏆
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Current Level</p>
                            <h2 className="text-3xl font-bold">Level {stats.level}</h2>
                        </div>
                        <div className="text-right">
                             <p className="text-2xl font-bold">{stats.xp}</p>
                             <p className="text-white/80 text-xs">Total XP</p>
                        </div>
                    </div>
                    
                    <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                    <p className="text-xs text-white/70 mt-2 text-right">
                        {1000 - (stats.xp % 1000)} XP to Level {stats.level + 1}
                    </p>
                </div>
             </div>
        </div>

        {/* Badges Grid */}
        <h3 className="font-bold text-lg text-[#212121] dark:text-white mb-4 flex items-center gap-2">
            <Star className="text-yellow-600" fill="currentColor" size={20} />
            Badges ({stats.earnedBadges.length}/{ALL_BADGES.length})
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_BADGES.map(badge => {
                const isUnlocked = stats.earnedBadges.includes(badge.id);
                
                return (
                    <div 
                        key={badge.id}
                        className={`
                            relative rounded-2xl p-4 flex flex-col items-center text-center border transition-all duration-300
                            ${isUnlocked 
                                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' 
                                : 'bg-slate-100 dark:bg-slate-900/50 border-transparent opacity-60 grayscale'}
                        `}
                    >
                        {/* Icon Circle */}
                        <div 
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-sm ${isUnlocked ? '' : 'bg-slate-200 dark:bg-slate-800'}`}
                            style={{ backgroundColor: isUnlocked ? `${badge.color}20` : undefined }}
                        >
                            {isUnlocked ? badge.icon : <Lock size={24} className="text-slate-400" />}
                        </div>

                        <h4 className="font-bold text-[#212121] dark:text-white text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs text-[#757575] dark:text-slate-400 mb-2 h-8 leading-tight flex items-center justify-center">
                            {badge.description}
                        </p>
                        
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${isUnlocked ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-500'}`}>
                            {isUnlocked ? 'Unlocked' : badge.requirement}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Badges;