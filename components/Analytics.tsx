
import React from 'react';
import { UserStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, IndianRupee, Leaf, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsProps {
  stats: UserStats;
}

const Analytics: React.FC<AnalyticsProps> = ({ stats }) => {
  const navigate = useNavigate();

  // Mock Data for Charts (Derived from base stats for demo purposes)
  const monthlyData = [
    { name: 'Jan', meals: 45 },
    { name: 'Feb', meals: 52 },
    { name: 'Mar', meals: 38 },
    { name: 'Apr', meals: 65 },
    { name: 'May', meals: 48 },
    { name: 'Jun', meals: stats.mealsSaved > 100 ? 85 : 30 },
  ];

  const categoryData = [
    { name: 'Produce', value: 45, color: '#00796B' },
    { name: 'Dairy', value: 25, color: '#F57C00' },
    { name: 'Bakery', value: 20, color: '#D32F2F' },
    { name: 'Pantry', value: 10, color: '#1976D2' },
  ];

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
        <h1 className="text-xl font-bold text-[#212121] dark:text-white">Impact Analytics</h1>
      </header>

      <div className="px-4 space-y-6 max-w-4xl mx-auto pb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                    <Utensils size={18} />
                    <span className="text-sm font-medium">Meals Saved</span>
                </div>
                <div className="text-3xl font-bold text-[#212121] dark:text-white">{stats.mealsSaved}</div>
                <div className="text-xs text-green-600 dark:text-green-400 font-bold mt-1 flex items-center gap-1">
                    <span>↑ 12%</span> <span className="font-normal text-slate-400">vs last month</span>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                    <IndianRupee size={18} />
                    <span className="text-sm font-medium">Money Saved</span>
                </div>
                <div className="text-3xl font-bold text-[#212121] dark:text-white">₹{stats.moneySaved}</div>
                 <div className="text-xs text-green-600 dark:text-green-400 font-bold mt-1 flex items-center gap-1">
                    <span>↑ ₹45</span> <span className="font-normal text-slate-400">this week</span>
                </div>
            </div>
        </div>

        {/* CO2 Impact Card */}
        <div className="bg-gradient-to-br from-[#00796B] to-[#00695C] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 opacity-90">
                    <Leaf size={24} />
                    <span className="font-bold text-lg">Environmental Impact</span>
                </div>
                <div className="text-4xl font-bold mb-2">{stats.co2Saved} kg</div>
                <p className="text-sm opacity-90 leading-relaxed max-w-[80%]">
                    of CO₂ emissions prevented. That's equivalent to driving a car for <strong>{Math.round(stats.co2Saved * 2.5)} miles</strong>!
                </p>
            </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-lg text-[#212121] dark:text-white mb-6">Meals Saved Trend</h3>
            <div className="h-[250px] w-full" aria-label="Bar chart showing meals saved over the last 6 months">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" opacity={0.3} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9E9E9E', fontSize: 12}} 
                            dy={10}
                        />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9E9E9E', fontSize: 12}} 
                        />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#333' }}
                        />
                        <Bar dataKey="meals" fill="#00796B" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Breakdown Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-lg text-[#212121] dark:text-white mb-4">Waste Saved by Category</h3>
            <div className="flex flex-col sm:flex-row items-center">
                <div className="h-[220px] w-full sm:w-1/2" aria-label="Pie chart showing waste saved percentage by category">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-4 mt-4 sm:mt-0 px-4">
                    {categoryData.map((cat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                            <span className="text-sm font-medium text-[#757575] dark:text-slate-300 flex-1">{cat.name}</span>
                            <span className="text-sm font-bold text-[#212121] dark:text-white">{cat.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
