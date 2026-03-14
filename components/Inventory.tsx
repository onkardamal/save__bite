import React, { useState, useRef, useMemo, useEffect } from 'react';
import { FoodItem, FoodCategory } from '../types';
import { analyzeFoodImage } from '../services/geminiService';
import { Menu, Leaf, Plus, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Loader2, Trash2, Pencil, Camera, X, CheckSquare, Sparkles, Check, Heart, Scale, Calendar, Milk, Beef, Croissant, Wheat, Package, IceCream, Coffee, Cookie, Info, AlertOctagon, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface InventoryProps {
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onUpdateStatus: (id: string, status: 'donated' | 'wasted' | 'consumed') => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: FoodItem) => void;
}

const getVisualDetails = (item: FoodItem) => {
  const nameLower = item.name.toLowerCase();
  
  let emoji = "📦";
  if (nameLower.includes("beef") || nameLower.includes("meat")) emoji = "🥩";
  else if (nameLower.includes("tomato") || nameLower.includes("lettuce") || nameLower.includes("vegetable")) emoji = "🥬";
  else if (nameLower.includes("bun") || nameLower.includes("bread")) emoji = "🍞";
  else if (nameLower.includes("cheese")) emoji = "🧀"; 
  else if (nameLower.includes("milk") || nameLower.includes("yogurt")) emoji = "🥛";
  else if (nameLower.includes("apple")) emoji = "🍎";
  else if (nameLower.includes("banana")) emoji = "🍌";
  else if (nameLower.includes("chicken")) emoji = "🍗";
  else if (nameLower.includes("egg")) emoji = "🥚";

  const now = new Date();
  now.setHours(0,0,0,0);
  const expiry = new Date(item.expiryDate);
  expiry.setHours(0,0,0,0);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusText = `${diffDays} days`;
  let statusColor = "#00796B"; 
  let freshnessPercent = 100;
  let isExpired = false;
  let isExpiringSoon = false;
  
  if (diffDays < 0) {
    statusText = "Expired";
    statusColor = "#D32F2F";
    freshnessPercent = 0;
    isExpired = true;
  } else if (diffDays <= 3) {
    statusText = diffDays === 0 ? "Expires today" : `Expires in ${diffDays}d`;
    statusColor = "#D32F2F";
    freshnessPercent = 10 + (diffDays * 10);
    isExpiringSoon = true;
  } else if (diffDays <= 6) {
    statusText = `${diffDays} days left`;
    statusColor = "#C2410C";
    freshnessPercent = 40 + (diffDays * 5);
  } else if (diffDays > 30) {
     const dateStr = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
     statusText = dateStr;
     freshnessPercent = 100;
  } else {
     statusText = `${diffDays} days`;
     freshnessPercent = Math.min(100, 30 + (diffDays * 3));
  }

  if (item.condition === "Expired") { 
    statusText = "Expired"; 
    statusColor = "#D32F2F"; 
    freshnessPercent = 0; 
    isExpired = true; 
    isExpiringSoon = false;
  }
  
  freshnessPercent = Math.max(0, Math.min(100, freshnessPercent));

  return { emoji, statusText, statusColor, freshnessPercent, isExpired, isExpiringSoon };
};

const CircularItem = ({ emoji, percent, color }: { emoji: string, percent: number, color: string }) => {
    const radius = 26;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
  
    return (
      <div className="relative w-[60px] h-[60px] flex items-center justify-center mr-[16px] shrink-0 group-hover:scale-110 transition-transform duration-300" role="img">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
           <circle
              stroke="#E0E0E0" 
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="dark:stroke-slate-700"
           />
           <circle
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
           />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[28px]">
            {emoji}
        </div>
        <div 
            className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white border border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-110"
            style={{ backgroundColor: color }}
        >
            {Math.round(percent)}%
        </div>
      </div>
    );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onInteract: () => void;
  disabled: boolean;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onEdit, onDelete, onInteract, disabled }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef(false);
  const hasSwiped = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    onInteract();
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startOffset.current = offset;
    isDragging.current = true;
    isScrolling.current = false;
    hasSwiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isScrolling.current || disabled) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
        isScrolling.current = true;
        isDragging.current = false;
        return;
    }

    if (Math.abs(diffX) > 5) {
        hasSwiped.current = true;
    }
    const newOffset = Math.min(0, Math.max(-120, startOffset.current + diffX));
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    isDragging.current = false;
    isScrolling.current = false;
    if (offset < -60) setOffset(-120); else setOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    onInteract();
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
    isDragging.current = true;
    isScrolling.current = false;
    hasSwiped.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || disabled) return;
    const currentX = e.clientX;
    const diffX = currentX - startX.current;
    if (Math.abs(diffX) > 5) hasSwiped.current = true;
    const newOffset = Math.min(0, Math.max(-120, startOffset.current + diffX));
    setOffset(newOffset);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (offset < -60) setOffset(-120); else setOffset(0);
    if (hasSwiped.current) {
        e.preventDefault();
        e.stopPropagation();
    }
  };

  const handleMouseLeave = () => {
      if (isDragging.current) {
          isDragging.current = false;
          if (offset < -60) setOffset(-120); else setOffset(0);
      }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
      if (hasSwiped.current) {
          e.preventDefault();
          e.stopPropagation();
          hasSwiped.current = false;
      }
  };

  return (
    <div className="relative w-full h-[88px] overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 w-[120px] flex rounded-r-xl overflow-hidden">
        <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); setOffset(0); }}
            className="flex-1 bg-blue-600 text-white flex flex-col items-center justify-center active:bg-blue-700 hover:bg-blue-500 transition-colors"
        >
            <Pencil size={18} />
            <span className="text-[10px] font-bold mt-1">Edit</span>
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); setOffset(0); }}
            className="flex-1 bg-[#D32F2F] text-white flex flex-col items-center justify-center active:bg-red-700 hover:bg-red-500 transition-colors"
        >
            <Trash2 size={18} />
            <span className="text-[10px] font-bold mt-1">Delete</span>
        </button>
      </div>
      <div 
        className="relative w-full h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm z-10 transition-all duration-200 ease-out touch-pan-y hover:shadow-md cursor-pointer group"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </div>
  );
};

const CATEGORIES = ["All", "Produce", "Dairy", "Meat", "Grains", "Bakery", "Canned", "Other"];

const CATEGORY_ICONS: Record<string, any> = {
    "Produce": { icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
    "Dairy": { icon: Milk, color: "text-blue-500", bg: "bg-blue-50" },
    "Meat": { icon: Beef, color: "text-red-500", bg: "bg-red-50" },
    "Grains": { icon: Wheat, color: "text-yellow-600", bg: "bg-yellow-50" },
    "Bakery": { icon: Croissant, color: "text-amber-700", bg: "bg-amber-50" },
    "Canned": { icon: Package, color: "text-slate-600", bg: "bg-slate-100" },
    "Other": { icon: Menu, color: "text-gray-500", bg: "bg-gray-50" },
};

const GRID_CATEGORIES = ["Produce", "Dairy", "Meat", "Grains", "Bakery", "Canned", "Other"];

const Inventory: React.FC<InventoryProps> = ({ items, onAddItem, onUpdateStatus, onDeleteItem, onEditItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<'expiry' | 'name'>('expiry');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<FoodItem | null>(null);
  
  // Tab state: 'available' vs 'expired'
  const [viewTab, setViewTab] = useState<'available' | 'expired'>('available');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const manualNameRef = useRef<HTMLInputElement>(null);
  const [isFromScan, setIsFromScan] = useState(false);

  const [manualForm, setManualForm] = useState({
    name: '',
    category: 'Produce',
    quantity: '1',
    unit: 'pcs',
    expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (location.state?.action) {
        if (location.state.action === 'add') startAdd();
        else if (location.state.action === 'scan') fileInputRef.current?.click();
        window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 150;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const { filteredItems, counts } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    // Initial filter for status and tab
    const baseItems = items.filter(item => {
        if (item.status !== 'active') return false;
        const expiry = new Date(item.expiryDate);
        expiry.setHours(0,0,0,0);
        const isActuallyExpired = expiry < today;
        return viewTab === 'available' ? !isActuallyExpired : isActuallyExpired;
    });

    // Count for category tabs based on active viewTab
    const catCounts: Record<string, number> = { "All": baseItems.length };
    CATEGORIES.slice(1).forEach(cat => {
        catCounts[cat] = baseItems.filter(i => i.category === cat).length;
    });

    // Secondary filter for search and category
    let filtered = baseItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    const sorted = filtered.sort((a, b) => {
        if (sortMode === 'expiry') return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        else return a.name.localeCompare(b.name);
    });

    return { filteredItems: sorted, counts: catCounts };
  }, [items, searchTerm, activeCategory, sortMode, viewTab]);

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedItemIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedItemIds(newSet);
  };

  const startEdit = (item: FoodItem) => {
      setEditingItem(item);
      setIsFromScan(false);
      setManualForm({
          name: item.name,
          category: item.category,
          quantity: item.quantity.toString(),
          unit: item.unit,
          expiryDate: item.expiryDate.split('T')[0]
      });
      setShowManualAdd(true);
      setTimeout(() => manualNameRef.current?.focus(), 100);
  };

  const startAdd = () => {
      setEditingItem(null);
      setIsFromScan(false);
      setManualForm({
          name: '',
          category: 'Produce',
          quantity: '1',
          unit: 'pcs',
          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      });
      setShowManualAdd(true);
      setTimeout(() => manualNameRef.current?.focus(), 100);
  };

  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };
  
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsAnalyzing(true); setScanError(null);
      try {
          const base64 = await compressImage(file);
          const analysis = await analyzeFoodImage(base64);
          setEditingItem(null); setIsFromScan(true);
          setManualForm({
              name: analysis.name, category: analysis.category,
              quantity: analysis.quantityEstimation.toString(), unit: analysis.unitEstimation,
              expiryDate: analysis.expiryEstimation
          });
          setTimeout(() => { setIsAnalyzing(false); setShowManualAdd(true); }, 500);
      } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '';
          if (msg === "NOT_FOOD") setScanError("No food detected. Please take a clearer photo of the item.");
          else if (msg.includes('GEMINI_API_KEY') || msg.includes('API Key')) setScanError("Add GEMINI_API_KEY to .env to use AI scan. You can still add items manually.");
          else setScanError("Could not identify food. Try a manual entry.");
          setIsAnalyzing(false);
      } finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const safeCategory = CATEGORIES.includes(manualForm.category) ? manualForm.category : 'Other';
        const itemData = {
            name: manualForm.name, category: safeCategory as FoodCategory,
            quantity: parseFloat(manualForm.quantity) || 1, unit: manualForm.unit,
            expiryDate: new Date(manualForm.expiryDate).toISOString(),
            status: 'active' as const, condition: editingItem ? editingItem.condition : 'Good'
        };
        if (editingItem) onEditItem({ ...editingItem, ...itemData });
        else onAddItem({ id: Math.random().toString(36).substr(2, 9), ...itemData });
        setShowManualAdd(false);
    };

  return (
    <div className="bg-[#FFFFFF] dark:bg-slate-950 min-h-screen pb-24 md:pb-0 animate-in fade-in duration-300 transition-colors" onClick={() => setShowSortMenu(false)}>
      
      {/* Hidden File Input for Scanning */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
        aria-hidden="true"
      />

      {/* Header Area */}
      <header className="pt-3 px-4 md:px-0 pb-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-[4px]">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:scale-90 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                    <ChevronLeft size={28} className="text-[#212121] dark:text-white" />
                </button>
                <h1 className="text-[24px] md:text-[32px] font-[700] text-[#212121] dark:text-white leading-tight">
                    {isSelectionMode ? "Select Ingredients" : viewTab === 'available' ? "Food Inventory" : "Expired History"}
                </h1>
            </div>
            {isSelectionMode ? (
                 <button 
                    onClick={() => { setIsSelectionMode(false); setSelectedItemIds(new Set()); }}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-[16px] h-[40px] rounded-[12px] font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                 >
                     Cancel
                 </button>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#00796B] text-white flex items-center justify-center w-10 md:w-auto md:px-4 h-10 rounded-xl active:scale-95 hover:bg-[#00695C] transition-all shadow-sm group"
                    >
                        <Camera size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[14px] font-[600] hidden md:inline ml-2">Scan</span>
                    </button>
                    <button 
                        onClick={startAdd}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#212121] dark:text-white flex items-center justify-center w-10 md:w-auto md:px-4 h-10 rounded-xl active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
                    >
                        <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-[14px] font-[600] hidden md:inline ml-2">Add</span>
                    </button>
                </div>
            )}
        </div>
        
        {/* VIEW TAB TOGGLE */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit mt-2 ml-1">
            <button 
                onClick={() => { setViewTab('available'); setActiveCategory('All'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${viewTab === 'available' ? 'bg-white dark:bg-slate-700 text-[#00796B] shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Package size={16} /> Available Stock
            </button>
            <button 
                onClick={() => { setViewTab('expired'); setActiveCategory('All'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${viewTab === 'expired' ? 'bg-white dark:bg-slate-700 text-[#D32F2F] shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <History size={16} /> Expired History
            </button>
        </div>
      </header>

      {/* Search & Controls Row */}
      <div className="px-4 md:px-0 mt-4 flex gap-3 relative z-20">
        <div className="flex-1 relative h-[44px] group">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#757575] dark:text-slate-500 group-focus-within:text-[#00796B] transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-[#F5F5F5] dark:bg-slate-800 rounded-[12px] pl-[40px] pr-[12px] text-[14px] outline-none focus:ring-2 focus:ring-[#00796B]/20 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder-[#757575] dark:placeholder-slate-500 text-[#212121] dark:text-white"
            />
        </div>
        <div className="flex flex-col gap-[8px] items-end relative">
            <div className="flex gap-2">
                 <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`h-9 w-9 md:w-auto md:px-3 rounded-xl flex items-center justify-center gap-2 border shadow-sm transition-all active:scale-95 ${isSelectionMode ? 'bg-[#00796B] border-[#00796B] text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#212121] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                     <CheckSquare size={16} />
                     <span className="hidden md:inline text-xs font-medium">Select</span>
                 </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                    className="h-9 w-[90px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-[#212121] dark:text-slate-200 text-xs font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                    <Filter size={14} /> {sortMode === 'expiry' ? 'Expiry' : 'Name'}
                </button>
            </div>
            {showSortMenu && (
                <div className="absolute top-11 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-1.5 w-[130px] z-30">
                    <button onClick={() => setSortMode('expiry')} className={`w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${sortMode === 'expiry' ? 'bg-[#00796B]/10 text-[#00796B] font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>Expiry Date</button>
                    <button onClick={() => setSortMode('name')} className={`w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${sortMode === 'name' ? 'bg-[#00796B]/10 text-[#00796B] font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>Name (A-Z)</button>
                </div>
            )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="relative mt-[16px] h-[48px] flex items-center overflow-hidden z-10">
        <div className="absolute left-0 top-0 bottom-0 w-[48px] bg-gradient-to-r from-white via-white/80 dark:from-slate-950 dark:via-slate-950/80 to-transparent z-20 pointer-events-none" />
        <button onClick={() => scrollTabs('left')} className="absolute left-1 z-30 h-8 w-8 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700 active:scale-90">
            <ChevronLeft size={16} className="text-[#00796B]" />
        </button>
        <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-3 px-12 md:px-6 scrollbar-hide w-full items-center h-full"
            style={{ scrollSnapType: 'x mandatory' }}
        >
            {CATEGORIES.map(cat => {
                const count = counts[cat] || 0;
                const isActive = activeCategory === cat;
                const highlightColor = viewTab === 'available' ? '#00796B' : '#D32F2F';
                
                return (
                    <button
                        key={cat} onClick={() => setActiveCategory(cat)}
                        className={`whitespace-nowrap px-4 h-9 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center border active:scale-95 ${isActive ? 'text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        style={{ backgroundColor: isActive ? highlightColor : undefined, borderColor: isActive ? highlightColor : undefined }}
                    >
                        {cat} <span className={`ml-1.5 opacity-60 text-[11px] ${isActive ? 'text-white' : ''}`}>({count})</span>
                    </button>
                );
            })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[48px] bg-gradient-to-l from-white via-white/80 dark:from-slate-950 dark:via-slate-950/80 to-transparent z-20 pointer-events-none" />
        <button onClick={() => scrollTabs('right')} className="absolute right-1 z-30 h-8 w-8 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700 active:scale-90">
            <ChevronRight size={16} className="text-[#00796B]" />
        </button>
      </div>

      {/* Food Items List */}
      <div className="px-4 md:px-0 mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-50 text-[#757575] dark:text-slate-400 animate-pulse">
                <Search size={48} className="mb-4" />
                <p>No items found in {viewTab === 'available' ? 'Available Stock' : 'Expired History'}.</p>
            </div>
        ) : filteredItems.map(item => {
            const visual = getVisualDetails(item);
            const isSelected = selectedItemIds.has(item.id);
            return (
                <div key={item.id} className="relative group">
                    <SwipeableCard onEdit={() => startEdit(item)} onDelete={() => onDeleteItem(item.id)} onInteract={() => {}} disabled={isSelectionMode}>
                        <div 
                            className={`w-full h-full flex items-center px-[16px] cursor-pointer transition-colors duration-300 ${isSelectionMode && isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}
                            onClick={() => { if (isSelectionMode) toggleSelection(item.id); else setDetailItem(item); }}
                        >
                            {isSelectionMode && (
                                <div className={`mr-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-[#00796B] bg-[#00796B] scale-110' : 'border-slate-300 dark:border-slate-600 scale-100'}`}>
                                    {isSelected && <CheckSquare size={14} className="text-white animate-in zoom-in-50" />}
                                </div>
                            )}
                            <CircularItem emoji={visual.emoji} percent={visual.freshnessPercent} color={visual.statusColor} />
                            <div className="flex-1 flex flex-col justify-center gap-[4px] min-w-0 pr-4">
                                <div className="flex items-baseline gap-[8px]" title={item.name}>
                                    <span className="text-[16px] font-[700] text-[#212121] dark:text-slate-100 truncate max-w-full group-hover:text-[#00796B] transition-colors">{item.name}</span>
                                    <span className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 shrink-0">{item.quantity} {item.unit}</span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-lg uppercase font-bold tracking-wide shrink-0">{item.category}</span>
                                    <div className="flex items-center gap-1.5">
                                        {visual.isExpiringSoon && <AlertTriangle size={12} className="text-[#D32F2F] animate-pulse" />}
                                        <span className={`text-[12px] font-[600] truncate transition-all ${visual.isExpiringSoon ? 'bg-red-50 dark:bg-red-900/20 px-1.5 rounded' : ''}`} style={{ color: visual.statusColor }}>{visual.statusText}</span>
                                    </div>
                                </div>
                            </div>
                            {!isSelectionMode && !visual.isExpired && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate('/donate', { state: { preSelectedItemIds: [item.id] } }); }}
                                    className="h-10 px-3 bg-red-50 dark:bg-red-900/20 text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white rounded-xl flex items-center gap-2 font-semibold text-xs active:scale-95 transition-all border border-transparent hover:border-[#D32F2F]"
                                >
                                    <Heart size={16} strokeWidth={2.5} className="group-hover:scale-125 transition-transform" />
                                    <span>Donate</span>
                                </button>
                            )}
                        </div>
                    </SwipeableCard>
                </div>
            );
        })}
      </div>
      
      {/* AI Analysis Overlay */}
      {isAnalyzing && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-xl flex flex-col items-center text-center mx-4 border border-slate-200 dark:border-slate-700">
                  <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center animate-pulse">
                          <Sparkles size={48} className="text-[#00796B]" fill="currentColor" />
                      </div>
                      <Loader2 size={100} className="absolute -inset-1 text-[#00796B] animate-spin opacity-20" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Analyzing Food</h3>
                  <div className="space-y-1 mb-6">
                      <p className="text-[#00796B] font-bold text-sm animate-pulse">AI is identifying ingredients...</p>
                      <p className="text-xs text-slate-500">Estimating condition and shelf life</p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00796B] h-full rounded-full animate-progress-indeterminate"></div>
                  </div>
                  <style>{`
                    @keyframes progress-indeterminate {
                        0% { transform: translateX(-100%) scaleX(0.2); }
                        50% { transform: translateX(0%) scaleX(0.5); }
                        100% { transform: translateX(100%) scaleX(0.2); }
                    }
                    .animate-progress-indeterminate {
                        animation: progress-indeterminate 1.5s infinite linear;
                        transform-origin: left;
                    }
                  `}</style>
                  <p className="mt-8 text-[11px] text-slate-400 font-medium italic">"Did you know? Every apple saved prevents the waste of 70 liters of water."</p>
              </div>
          </div>
      )}

      {/* Manual Add / Scan Result Modal */}
      {showManualAdd && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold dark:text-white">{editingItem ? 'Edit Item' : isFromScan ? 'Confirm Scan Results' : 'Add New Item'}</h3>
                          <button onClick={() => setShowManualAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                      </div>

                      <form onSubmit={handleManualSubmit} className="space-y-4">
                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Item Name</label>
                              <input 
                                ref={manualNameRef}
                                type="text" required placeholder="e.g., Organic Bananas"
                                value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})}
                                className="w-full h-[52px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#00796B] outline-none transition-all dark:text-white"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quantity</label>
                                  <input type="number" step="any" required
                                      value={manualForm.quantity} onChange={e => setManualForm({...manualForm, quantity: e.target.value})}
                                      className="w-full h-[52px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#00796B] outline-none transition-all dark:text-white"
                                  />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unit</label>
                                  <select value={manualForm.unit} onChange={e => setManualForm({...manualForm, unit: e.target.value})}
                                      className="w-full h-[52px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#00796B] outline-none transition-all dark:text-white"
                                  >
                                      {["pcs", "kg", "grams", "pack", "jar", "liter", "ml", "head"].map(u => <option key={u} value={u}>{u}</option>)}
                                  </select>
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                              <div className="grid grid-cols-4 gap-2">
                                  {GRID_CATEGORIES.map(cat => (
                                      <button key={cat} type="button" onClick={() => setManualForm({...manualForm, category: cat})}
                                          className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${manualForm.category === cat ? 'bg-[#00796B] border-[#00796B] text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                      >
                                          {cat}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Expiry Date</label>
                              <input type="date" required value={manualForm.expiryDate} onChange={e => setManualForm({...manualForm, expiryDate: e.target.value})}
                                  className="w-full h-[52px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#00796B] outline-none transition-all dark:text-white"
                              />
                          </div>

                          <button type="submit" className="w-full h-[56px] bg-[#00796B] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#00695C] transition-all active:scale-95 mt-4">
                              {editingItem ? 'Save Changes' : isFromScan ? 'Confirm Results' : 'Add to Inventory'}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* Error Toasts */}
      {scanError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2100] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
              <AlertOctagon size={20} />
              <span className="font-bold text-sm">{scanError}</span>
              <button onClick={() => setScanError(null)} className="ml-2 bg-white/20 p-1 rounded-full"><X size={14} /></button>
          </div>
      )}
      
      {/* Item Detail Modal */}
      {detailItem && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-3xl shadow-inner animate-in spin-in-12 duration-500">
                                  {getVisualDetails(detailItem).emoji}
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-[#212121] dark:text-white leading-tight">{detailItem.name}</h3>
                                  <span className="text-xs font-bold text-[#00796B] uppercase tracking-wider">{detailItem.category}</span>
                              </div>
                          </div>
                          <button onClick={() => setDetailItem(null)} className="p-1 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                              <X size={24} />
                          </button>
                      </div>
                      
                      <div className="space-y-4 py-2">
                          {[
                            { icon: Scale, label: 'Quantity', value: `${detailItem.quantity} ${detailItem.unit}` },
                            { icon: Calendar, label: 'Expiry Date', value: new Date(detailItem.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                            { icon: Info, label: 'Condition', value: detailItem.condition || (getVisualDetails(detailItem).isExpired ? "Expired" : "Good"), isBadge: true }
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <row.icon size={18} />
                                    <span className="text-sm font-semibold">{row.label}</span>
                                </div>
                                <span className={`font-bold ${row.isBadge ? `px-2 py-0.5 rounded-full text-xs ${getVisualDetails(detailItem).isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}` : 'text-[#212121] dark:text-white'}`}>
                                    {row.value}
                                </span>
                            </div>
                          ))}
                      </div>
                      
                      {getVisualDetails(detailItem).isExpired ? (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-800 animate-in slide-in-from-top-2">
                            <AlertOctagon size={18} className="text-red-600 shrink-0 mt-0.5 animate-pulse" />
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium">Safety Alert: This item is expired and cannot be donated to partner NGOs.</p>
                        </div>
                      ) : getVisualDetails(detailItem).isExpiringSoon ? (
                        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-start gap-3 border border-orange-100 dark:border-orange-800 animate-in slide-in-from-top-2">
                            <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5 animate-bounce" />
                            <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">Use Soon: This item expires within 3 days. Consider cooking or donating it now!</p>
                        </div>
                      ) : null}

                      <div className="mt-6 flex gap-3">
                          <button onClick={() => { startEdit(detailItem); setDetailItem(null); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-[#212121] dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95">
                              <Pencil size={18} /> Edit
                          </button>
                          {!getVisualDetails(detailItem).isExpired && (
                            <button onClick={() => { navigate('/donate', { state: { preSelectedItemIds: [detailItem.id] } }); setDetailItem(null); }} className="flex-[2] py-3 bg-[#00796B] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-[#00695C] hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20">
                                <Heart size={18} fill="white" className="animate-pulse" /> Donate Now
                            </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isSelectionMode && selectedItemIds.size > 0 && (
          <div className="fixed bottom-24 md:bottom-8 right-6 z-40 animate-in zoom-in slide-in-from-bottom-4">
              <button onClick={() => { navigate('/recipes', { state: { ingredients: items.filter(i => selectedItemIds.has(i.id)).map(i => i.name).join(', ') } }); }} className="bg-[#00796B] text-white px-6 py-4 rounded-2xl shadow-xl shadow-teal-500/30 flex items-center gap-3 font-bold text-lg hover:scale-105 active:scale-95 transition-all group">
                  <Sparkles fill="white" size={24} className="group-hover:rotate-12 transition-transform" />
                  <span>Cook {selectedItemIds.size} Items</span>
              </button>
          </div>
      )}
    </div>
  );
};

export default Inventory;