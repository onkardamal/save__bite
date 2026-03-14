
import React, { useMemo } from 'react';
import { UserStats, User } from '../types';
import { ArrowLeft, Trophy, Medal, Crown, Shield, Flame, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardProps {
  user: User | null;
  stats: UserStats;
}

// Simulated Community Data
// Added isCurrentUser: false to each entry to match the type of the current user entry
export const MOCK_LEADERBOARD_DATA = [
    { id: 'c1', name: 'Sarah Jenkins', meals: 234, xp: 12450, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', isCurrentUser: false },
    { id: 'c2', name: 'Green Grocers', meals: 198, xp: 11200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Green', isCurrentUser: false },
    { id: 'c3', name: 'Mike Chen', meals: 167, xp: 9800, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', isCurrentUser: false },
    { id: 'c4', name: 'Bistro 54', meals: 145, xp: 8900, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bistro', isCurrentUser: false },
    { id: 'c5', name: 'Annie P.', meals: 120, xp: 7500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Annie', isCurrentUser: false },
    { id: 'c6', name: 'Community Fridge', meals: 98, xp: 6200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fridge', isCurrentUser: false },
    { id: 'c7', name: 'Tom H.', meals: 85, xp: 5400, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', isCurrentUser: false },
    { id: 'c8', name: 'Fresh Market', meals: 64, xp: 4100, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fresh', isCurrentUser: false },
    { id: 'c9', name: 'Julia R.', meals: 42, xp: 2800, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia', isCurrentUser: false },
    { id: 'c10', name: 'The Local Bakery', meals: 30, xp: 1900, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bakery', isCurrentUser: false },
];

const Leaderboard: React.FC<LeaderboardProps> = ({ user, stats }) => {
  const navigate = useNavigate();

  // Merge current user with mock data and sort
  const sortedData = useMemo(() => {
    const currentUserEntry = {
        id: 'current-user',
        name: user?.name || 'You',
        meals: stats.mealsSaved,
        xp: stats.xp,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`,
        isCurrentUser: true
    };

    const allUsers = [...MOCK_LEADERBOARD_DATA, currentUserEntry];
    return allUsers.sort((a, b) => b.xp - a.xp);
  }, [user, stats]);

  const topThree = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);
  const userRank = sortedData.findIndex(u => u.isCurrentUser) + 1;

  const renderPodiumItem = (item: typeof sortedData[0], rank: number) => {
      let height = 'h-32';
      let color = 'bg-slate-100 dark:bg-slate-800';
      let medalColor = 'text-amber-700';
      let scale = 'scale-100';
      let zIndex = 'z-10';

      if (rank === 1) {
          height = 'h-40';
          color = 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
          medalColor = 'text-yellow-500';
          scale = 'scale-110';
          zIndex = 'z-20';
      } else if (rank === 2) {
          height = 'h-36';
          color = 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600';
          medalColor = 'text-slate-400';
      } else if (rank === 3) {
          color = 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700';
          medalColor = 'text-orange-600';
      }

      return (
          <div className={`flex flex-col items-center justify-end ${scale} ${zIndex} transition-all duration-500`}>
              <div className="relative mb-3">
                  <div className={`w-16 h-16 rounded-full border-4 ${rank === 1 ? 'border-yellow-400' : 'border-white dark:border-slate-800'} overflow-hidden shadow-lg`}>
                      <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
                      {rank === 1 ? <Crown size={16} className="text-yellow-500 fill-yellow-500" /> : 
                       <span className="text-xs font-bold w-5 h-5 flex items-center justify-center text-slate-700 dark:text-slate-300">{rank}</span>
                      }
                  </div>
              </div>
              <div className="text-center mb-2">
                  <p className={`font-bold text-sm ${item.isCurrentUser ? 'text-[#00796B]' : 'text-[#212121] dark:text-white'} truncate max-w-[100px]`}>
                      {item.isCurrentUser ? 'You' : item.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-[#757575] dark:text-slate-400 font-medium">{item.xp.toLocaleString()} XP</p>
              </div>
              <div className={`w-full ${height} ${color} rounded-t-2xl shadow-sm border-t border-x flex items-end justify-center pb-4 relative`}>
                   <div className="text-3xl font-black opacity-10">{rank}</div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 pb-24 md:pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="pt-4 px-4 pb-6 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Back"
            >
                <ArrowLeft size={24} className="text-[#212121] dark:text-white" />
            </button>
            <h1 className="text-xl font-bold text-[#212121] dark:text-white">Leaderboard</h1>
        </div>
        
        {/* User Stats Summary */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#00796B] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {userRank}
                 </div>
                 <div>
                     <p className="text-xs text-[#757575] dark:text-slate-400 font-medium uppercase">Your Rank</p>
                     <p className="font-bold text-[#212121] dark:text-white">Top {Math.ceil((userRank / sortedData.length) * 100)}%</p>
                 </div>
             </div>
             <div className="text-right">
                 <p className="text-xs text-[#757575] dark:text-slate-400 font-medium uppercase">Your Impact</p>
                 <div className="flex items-center gap-1 justify-end">
                     <Flame size={14} className="text-orange-500 fill-orange-500" />
                     <p className="font-bold text-[#212121] dark:text-white">{stats.xp.toLocaleString()} XP</p>
                 </div>
             </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
          {/* Podium Section */}
          <div className="pt-8 pb-4 px-8 flex justify-center items-end gap-2 md:gap-8 mb-4">
              {/* 2nd Place */}
              <div className="w-1/3 max-w-[120px]">
                 {topThree[1] ? renderPodiumItem(topThree[1], 2) : <div className="h-32" />}
              </div>
              {/* 1st Place */}
              <div className="w-1/3 max-w-[120px]">
                 {topThree[0] ? renderPodiumItem(topThree[0], 1) : <div className="h-32" />}
              </div>
              {/* 3rd Place */}
              <div className="w-1/3 max-w-[120px]">
                 {topThree[2] ? renderPodiumItem(topThree[2], 3) : <div className="h-32" />}
              </div>
          </div>

          {/* List Section */}
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl min-h-[500px] shadow-lg p-6 space-y-2">
              <h3 className="font-bold text-[#212121] dark:text-white mb-4 px-2">Community Rankings</h3>
              
              {restOfList.map((item, index) => {
                  const rank = index + 4;
                  return (
                      <div 
                        key={item.id} 
                        className={`
                            flex items-center p-3 rounded-xl transition-all
                            ${item.isCurrentUser 
                                ? 'bg-[#00796B]/10 border border-[#00796B]/30 shadow-sm scale-[1.02]' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}
                        `}
                      >
                          <div className="w-8 font-bold text-[#757575] dark:text-slate-500 text-center">{rank}</div>
                          <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full mx-3 bg-slate-200" />
                          <div className="flex-1">
                              <p className={`font-bold text-sm ${item.isCurrentUser ? 'text-[#00796B]' : 'text-[#212121] dark:text-white'}`}>
                                  {item.name} {item.isCurrentUser && '(You)'}
                              </p>
                              <p className="text-xs text-[#757575] dark:text-slate-400">{item.meals} meals saved</p>
                          </div>
                          <div className="font-bold text-sm text-[#212121] dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                              {item.xp.toLocaleString()} XP
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
      
      {/* Sticky User Row (if user is not in view/top) */}
      {userRank > 10 && (
          <div className="fixed bottom-[80px] md:bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 md:pl-[260px]">
              <div className="max-w-3xl mx-auto flex items-center p-3 rounded-xl bg-[#00796B] text-white shadow-lg">
                  <div className="w-8 font-bold text-white/80 text-center">{userRank}</div>
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="You" className="w-10 h-10 rounded-full mx-3 border-2 border-white/20" />
                  <div className="flex-1">
                      <p className="font-bold text-sm">You</p>
                      <p className="text-xs text-white/80">{stats.mealsSaved} meals saved</p>
                  </div>
                  <div className="font-bold text-sm bg-white/20 px-3 py-1 rounded-full">
                      {stats.xp.toLocaleString()} XP
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Leaderboard;
