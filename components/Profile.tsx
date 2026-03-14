
import React, { useState, useRef, useEffect } from 'react';
import { User, UserStats, DonationHistoryItem, Review } from '../types';
import { ArrowLeft, User as UserIcon, Settings, Bell, Shield, ShieldCheck, HelpCircle, LogOut, Moon, Sun, ChevronRight, Award, Flame, X, Lock, Eye, FileText, Sparkles, Check, Clock, Star, HeartHandshake, CheckCircle2, MessageSquare, Trash2, AlertOctagon, Loader2, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import Analytics from './Analytics';

interface ProfileProps {
  user: User | null;
  stats: UserStats;
  onLogout: () => void;
  onUpdateStats: (stats: UserStats) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, stats, onLogout, onUpdateStats }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language === 'hi' ? 'hi' : i18n.language === 'mr' ? 'mr' : 'en') as 'en' | 'hi' | 'mr';
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('history');
  const [showRateModal, setShowRateModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleBack = () => {
    navigate('/');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const updatedHistory = stats.history.map(item => {
      if (item.id === showRateModal) {
        return {
          ...item,
          review: {
            rating,
            tags: selectedTags,
            comment: comment.trim() || undefined
          }
        };
      }
      return item;
    });

    onUpdateStats({
      ...stats,
      history: updatedHistory
    });

    setShowRateModal(null);
    setRating(0);
    setSelectedTags([]);
    setComment('');
    
    // Success feedback
    setShowConfetti(true);
    setToast("Review Submitted! XP Multiplier increased.");
    setTimeout(() => {
        setShowConfetti(false);
        setToast(null);
    }, 4000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
        localStorage.removeItem(`savebite_data_${user.id}`);
        onLogout();
    } catch (err) {
        console.error("Failed to delete account", err);
        setToast("Error deleting account. Please try again.");
    } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Simple Confetti Animation Component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            backgroundColor: ['#FFD700', '#FF8C00', '#00796B', '#80CBC4'][i % 4],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation-name: confetti; animation-timing-function: linear; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 pb-24 md:pb-8 animate-slide-in-right relative">
      {showConfetti && <Confetti />}
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] glass-panel-strong border-2 border-[#00796B] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in-down">
            <CheckCircle2 className="text-[#00796B]" size={24} />
            <span className="font-bold text-[#212121] dark:text-white">{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="pt-4 px-4 pb-4 glass-panel sticky top-0 z-30 mb-4 flex items-center gap-3 rounded-b-2xl border-b border-x border-white/40 dark:border-white/10 shadow-sm">
        <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            type="button"
            aria-label="Back"
        >
            <ArrowLeft size={24} className="text-[#212121] dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-[#212121] dark:text-white">My Impact Profile</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* Profile Card */}
        <div className="glass-panel-strong rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group border border-white/40 dark:border-white/10">
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-amber-500/5 pointer-events-none"></div>
             <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-[6px] border-amber-400 p-1 shadow-amber-400/20 shadow-2xl">
                    <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} className="w-full h-full rounded-full bg-slate-200 object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                    <Sparkles size={20} fill="currentColor" />
                </div>
             </div>
             <div className="space-y-1 mb-6">
                 <h2 className="text-3xl font-black text-[#212121] dark:text-white flex items-center justify-center gap-2">
                    {stats.xp.toLocaleString()} <span className="text-[#00796B]">XP</span>
                    <Sparkles className="text-amber-500" size={24} fill="currentColor" />
                 </h2>
                 <p className="text-lg font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2 flex-wrap">
                    {user.name}
                    {user.fssaiId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#00796B]/20 text-[#00796B] dark:bg-teal-500/20 dark:text-teal-400 text-xs font-bold">
                        <ShieldCheck size={14} strokeWidth={2.5} /> {t('profile.verified')}
                      </span>
                    )}
                    <span>• Lvl {stats.level}</span>
                 </p>
             </div>
             <div className="w-full max-w-[280px] h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-[#00796B] to-amber-400 transition-all duration-1000 ease-out" style={{ width: `${(stats.xp % 1000) / 10}%` }}></div>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase">{stats.xp > 0 ? (1000 - (stats.xp % 1000)) : 1000} XP to next tier</p>
        </div>

        {/* Tabs */}
        <div className="flex glass-card p-1.5 rounded-2xl border border-white/40 dark:border-white/10">
            <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-[#00796B] text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/10'}`}>My Analytics</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-[#00796B] text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/10'}`}>Rescue History</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' ? (
            <Analytics stats={stats} />
        ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-black text-[#212121] dark:text-white uppercase tracking-wider text-sm pl-2">Donation Timeline</h3>
                <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                    {stats.history.map((item) => {
                        const isCompleted = item.status === 'completed';
                        const isRated = !!item.review;
                        return (
                            <div key={item.id} className="relative">
                                <div className={`absolute -left-[27px] top-4 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center z-10 ${isCompleted ? 'bg-[#00796B]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    {isCompleted ? <Check size={12} className="text-white" strokeWidth={4} /> : <Clock size={12} className="text-white" strokeWidth={4} />}
                                </div>
                                <div className="glass-card rounded-2xl p-5 flex flex-col group hover:shadow-md transition-all border border-white/40 dark:border-white/10">
                                    <div className="flex items-center justify-between w-full mb-3">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="font-bold text-lg text-[#212121] dark:text-white truncate">{item.foodName}</h4>
                                            <p className="text-xs text-slate-500 font-medium">{item.date}</p>
                                        </div>
                                        <div className="bg-teal-50 dark:bg-teal-900/30 text-[#00796B] px-3 py-1.5 rounded-xl font-black text-xs shrink-0 flex flex-col items-center"><Sparkles size={14} className="mb-0.5" />+{item.points} XP</div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">🏢</div>
                                        <p className="text-sm text-[#00796B] font-bold">Partner: {item.ngoName}</p>
                                    </div>
                                    {isCompleted && (
                                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                            {isRated ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-0.5 text-amber-400">{[...Array(5)].map((_, i) => (<Star key={i} size={16} fill={i < (item.review?.rating || 0) ? "currentColor" : "none"} />))}<span className="text-xs font-bold text-slate-400 ml-2">Rating Given</span></div>
                                                    {item.review?.comment && (<div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl relative"><MessageSquare className="absolute -top-2 -left-2 text-teal-400" size={16} fill="currentColor" /><p className="text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed pl-2">"{item.review.comment}"</p></div>)}
                                                </div>
                                            ) : (
                                                <button onClick={() => setShowRateModal(item.id)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:border-[#00796B] hover:text-[#00796B] transition-all flex items-center justify-center gap-2"><Star size={14} /> Rate & Comment this Handover</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Preferences & Logout */}
        <div className="pt-8 space-y-4">
            <h3 className="font-black text-[#212121] dark:text-white uppercase tracking-wider text-sm pl-2">Preferences</h3>
            <div className="glass-card rounded-2xl overflow-hidden border border-white/40 dark:border-white/10">
                <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">{theme === 'light' ? <Sun size={20} className="text-slate-400" /> : <Moon size={20} className="text-slate-400" />}</div>
                        <span className="font-medium text-[#212121] dark:text-white">Appearance</span>
                    </div>
                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400 uppercase">{theme} Mode</span><div className={`w-11 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#00796B]' : 'bg-slate-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} /></div></div>
                </button>
                <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><Languages size={20} className="text-slate-400" /></div>
                        <span className="font-medium text-[#212121] dark:text-white">Language</span>
                    </div>
                    <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                        <button type="button" onClick={() => changeLanguage('en')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${currentLang === 'en' ? 'bg-[#00796B] text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t('language.labelShortEn')}</button>
                        <button type="button" onClick={() => changeLanguage('hi')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${currentLang === 'hi' ? 'bg-[#00796B] text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t('language.labelShortHi')}</button>
                        <button type="button" onClick={() => changeLanguage('mr')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${currentLang === 'mr' ? 'bg-[#00796B] text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t('language.labelShortMr')}</button>
                    </div>
                </div>
                <button onClick={onLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center"><LogOut size={20} className="text-red-500" /></div>
                        <span className="font-bold">Log Out</span>
                    </div>
                    <ChevronRight size={18} className="text-red-300" />
                </button>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 pb-12 space-y-4">
            <h3 className="font-black text-red-600 dark:text-red-500 uppercase tracking-wider text-sm pl-2">Danger Zone</h3>
            <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl p-6 border-2 border-dashed border-red-200 dark:border-red-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-red-700 dark:text-red-400">Delete Account</h4>
                    <p className="text-sm text-red-600/70 dark:text-red-400/60 leading-relaxed">Permanently remove your account and all saved impact data, CO2 statistics, and history.</p>
                </div>
                <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                >
                    <Trash2 size={18} /> Delete Account
                </button>
            </div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="glass-panel-strong w-full max-w-sm rounded-3xl overflow-hidden animate-scale-in border border-white/40 dark:border-white/10">
                  <div className="p-8">
                      <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-red-100/80 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                              <AlertOctagon size={32} className="text-red-600" />
                          </div>
                      </div>

                      <div className="text-center mb-8">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Delete Account?</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                              This action is <strong>irreversible</strong>. You will lose your <strong>{stats.xp} XP</strong>, your <strong>{stats.level} levels</strong>, and your history of <strong>{stats.mealsSaved} meals saved</strong>.
                          </p>
                      </div>

                      <div className="space-y-3">
                          <button 
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                          >
                              {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <><Trash2 size={20} /> Yes, Delete Forever</>}
                          </button>
                          <button 
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                          >
                              Cancel
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Rating Modal */}
      {showRateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
              <div className="glass-panel-strong w-full max-w-sm rounded-3xl overflow-hidden animate-scale-in border border-white/40 dark:border-white/10" role="dialog" aria-modal="true">
                  <div className="p-8">
                      <div className="flex justify-between items-center mb-6">
                          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center shadow-inner"><Star size={24} className="text-[#00796B]" fill="currentColor" /></div>
                          <button onClick={() => setShowRateModal(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                      </div>
                      <div className="text-center mb-6">
                          <h3 className="text-xl font-black text-[#212121] dark:text-white leading-tight mb-2">Rate the Handover</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stats.history.find(h => h.id === showRateModal)?.ngoName}</p>
                      </div>
                      <div className="flex justify-center gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="transition-transform active:scale-90 hover:scale-110" type="button">
                                  <Star size={32} className={`${(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} fill={(hoverRating || rating) >= star ? "currentColor" : "none"} strokeWidth={2.5} />
                              </button>
                          ))}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                          {["Punctual ⏰", "Polite 😊", "Professional 👔", "Helpful 🆘"].map(tag => (
                              <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border-2 transition-all ${selectedTags.includes(tag) ? 'bg-[#00796B] border-[#00796B] text-white shadow-sm' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'}`} type="button">{tag}</button>
                          ))}
                      </div>
                      <div className="mb-8">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Write a short comment</label>
                          <div className="relative"><textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#00796B] focus:bg-white dark:focus:bg-slate-800 text-sm outline-none transition-all font-medium resize-none" placeholder="Tell us more about the handover..." rows={3} /><MessageSquare className="absolute bottom-3 right-3 text-slate-300" size={16} /></div>
                      </div>
                      <button onClick={handleReviewSubmit} disabled={rating === 0} className="w-full py-4 bg-[#212121] dark:bg-white text-white dark:text-[#212121] rounded-2xl font-black text-lg shadow-xl shadow-black/10 hover:bg-black dark:hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-2">Complete Review</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;
