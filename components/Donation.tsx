import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FoodItem, NGO, User } from '../types';
import { ChevronLeft, Check, ShoppingBag, Map as MapIcon, List, MapPin, AlertCircle, Star, Loader2, Phone, Mail, Calendar, Truck, MessageSquare, Clock, Info, ShieldCheck, Copy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import { searchNearbyNGOs } from '../services/geminiService';
import { isEligibleForDonation } from '../utils/donationSafety';
import { buildHandoverSummary, buildHandoverEmailBody, openHandoverMailto } from '../utils/donationHandover';
import { sendHandoverEmailToNgo, isEmailConfigured } from '../services/emailService';

// Fix Leaflet's default icon path issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DonationProps {
  user: User | null;
  inventory: FoodItem[];
  onDonateComplete: (itemIds: string[], amount: number) => void;
}

// Real contacts: clicking phone opens dialer, email opens mail client
const DEFAULT_NGOS: NGO[] = [
  { id: '1', name: "Robin Hood Army", distance: "1.2 km", urgency: "High", lat: 28.5355, lng: 77.3910, description: "Volunteer-based food distribution", needs: [], rating: 4.8, phone: "+919876543210", email: "contact@robinhoodarmy.com" },
  { id: '2', name: "No Food Waste", distance: "3.5 km", urgency: "Medium", lat: 13.0827, lng: 80.2707, description: "Surplus food rescue and distribution", needs: [], rating: 4.5, phone: "+919840316414", email: "info@nofoodwaste.org" },
  { id: '3', name: "Feeding India", distance: "5.0 km", urgency: "Low", lat: 28.6139, lng: 77.2090, description: "Connects surplus food with those in need", needs: [], rating: 4.9, phone: "+911141234567", email: "hello@feedingindia.org" },
  { id: '4', name: "St. Mary's Kitchen", distance: "2.1 km", urgency: "High", lat: 28.7041, lng: 77.1025, description: "Soup kitchen and daily meals", needs: [], rating: 4.7, phone: "+911123456789", email: "info@stmaryskitchen.org" },
];

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [1, 2, 3];
  return (
    <div className="flex items-center justify-center h-[48px] mt-[12px]">
      {steps.map((step, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        let bgColor = '#E0E0E0';
        let textColor = '#757575';
        if (isCompleted || isActive) {
            bgColor = '#00796B';
            textColor = '#FFFFFF';
        }
        return (
          <React.Fragment key={step}>
            <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-bold z-10 transition-all duration-300 ease-out scale-100 active:scale-95" style={{ backgroundColor: bgColor, color: textColor }}>
              {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-[40px] h-[2px] mx-[4px] transition-colors duration-300 ${isCompleted ? 'bg-[#00796B]' : 'bg-[#E0E0E0]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const DonationItemRow: React.FC<{
  item: FoodItem;
  selected: boolean;
  onToggle: (id: string) => void;
}> = ({ item, selected, onToggle }) => {
  const expiryDate = new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  return (
    <div 
        onClick={() => onToggle(item.id)}
        className={`min-h-[84px] w-full px-4 py-3 mx-4 mb-3 flex items-center rounded-2xl transition-all duration-200 cursor-pointer border ${
            selected ? 'glass-card border-[#00796B]/40 ring-2 ring-[#00796B]/20' : 'glass-card border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5'
        }`}
    >
        <div className={`w-[24px] h-[24px] rounded-[4px] border-[2px] flex items-center justify-center transition-colors shrink-0 ${selected ? 'bg-[#00796B] border-[#00796B]' : 'border-[#BDBDBD]'}`}>
            {selected && <Check size={16} color="white" strokeWidth={3} />}
        </div>
        <div className="ml-[12px] flex-1 min-w-0">
            <h3 className="text-[16px] font-[600] text-[#212121] dark:text-white truncate">{item.name}</h3>
            <p className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 mt-[2px]">{item.quantity} {item.unit}{item.condition ? ` · ${item.condition}` : ''}</p>
        </div>
        <div className="bg-[#F5F5F5] dark:bg-slate-800 rounded-[4px] px-[8px] py-[4px] ml-[8px] shrink-0">
            <span className="text-[12px] font-[500] text-[#757575] dark:text-slate-400">Exp: {expiryDate}</span>
        </div>
    </div>
  );
};

const Donation: React.FC<DonationProps> = ({ user, inventory, onDonateComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [ngos, setNgos] = useState<NGO[]>(DEFAULT_NGOS);
  const [loadingNGOs, setLoadingNGOs] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [logistics, setLogistics] = useState({
      mode: 'dropoff' as 'dropoff' | 'pickup',
      contactPhone: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: '12:00'
  });
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [lastHandoverSummaryText, setLastHandoverSummaryText] = useState<string | null>(null);
  const [handoverEmailOpened, setHandoverEmailOpened] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showNgoApiKeyHint, setShowNgoApiKeyHint] = useState(false);

  // Only items that are safe to donate: not expired, not spoiled/unsafe condition
  const donatableItems = useMemo(() => inventory.filter(isEligibleForDonation), [inventory]);

  const selectedFoodObjects = useMemo(() => 
    donatableItems.filter(i => selectedItems.includes(i.id)), 
    [donatableItems, selectedItems]
  );

  useEffect(() => {
    if (currentStep !== 3) setSafetyConfirmed(false);
  }, [currentStep]);

  useEffect(() => {
      if (location.state?.preSelectedNgo) {
          const pre = location.state.preSelectedNgo;
          setNgos(prev => prev.find(n => n.id === pre.id) ? prev : [pre, ...prev]);
          setSelectedNgoId(pre.id);
      }
      if (location.state?.preSelectedItemIds) {
          // Verify pre-selected items are not expired
          const validIds = location.state.preSelectedItemIds.filter((id: string) => 
            donatableItems.some(item => item.id === id)
          );
          setSelectedItems(validIds);
      }
  }, [location.state, donatableItems]);

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else navigate(-1);
  };

  const isPhoneValid = logistics.contactPhone.length === 10 && /^\d+$/.test(logistics.contactPhone);

  const handleContinue = async () => {
      if (currentStep < 3) setCurrentStep(prev => prev + 1);
      else {
          const selectedNgo = ngos.find(n => n.id === selectedNgoId);
          if (!selectedNgo) return;
          const summary = buildHandoverSummary({
            ngoName: selectedNgo.name,
            donorName: user?.name ?? 'Donor',
            donorPhone: logistics.contactPhone,
            handoverDate: logistics.date,
            handoverTime: logistics.time,
            mode: logistics.mode,
            items: selectedFoodObjects,
            notes: logistics.notes,
          });
          const bodyText = buildHandoverEmailBody(summary);
          setLastHandoverSummaryText(bodyText);
          setEmailSent(false);
          setEmailError(null);
          setHandoverEmailOpened(false);
          onDonateComplete(selectedItems, selectedItems.length * 10);

          if (selectedNgo.email && isEmailConfigured()) {
            setSendingEmail(true);
            const result = await sendHandoverEmailToNgo(selectedNgo.email, summary);
            setSendingEmail(false);
            if (result.ok) {
              setEmailSent(true);
            } else {
              setEmailError(result.error ?? 'Send failed');
              openHandoverMailto(selectedNgo.email, summary);
              setHandoverEmailOpened(true);
            }
          } else if (selectedNgo.email) {
            openHandoverMailto(selectedNgo.email, summary);
            setHandoverEmailOpened(true);
          }
          setCurrentStep(4);
      }
  };

  const handleCopyHandoverSummary = async () => {
    if (!lastHandoverSummaryText) return;
    try {
      await navigator.clipboard.writeText(lastHandoverSummaryText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lastHandoverSummaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  useEffect(() => {
    if (currentStep === 2) {
        setLoadingNGOs(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const results = await searchNearbyNGOs(pos.coords.latitude, pos.coords.longitude);
                    if (results.length > 0) {
                        setNgos(results);
                        setShowNgoApiKeyHint(false);
                    }
                } catch (e) {
                    console.error(e);
                    const msg = e instanceof Error ? e.message : '';
                    if (msg.includes('GEMINI_API_KEY') || msg.includes('API Key')) setShowNgoApiKeyHint(true);
                } finally {
                    setLoadingNGOs(false);
                }
            }, () => setLoadingNGOs(false));
        } else setLoadingNGOs(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 2 || viewMode !== 'map' || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    const container = mapContainerRef.current;
    if (mapRef.current) mapRef.current.remove();
    const [lat, lng] = ngos.length > 0 ? [ngos[0].lat, ngos[0].lng] : [28.5355, 77.391];
    const map = L.map(container, { zoomControl: false, attributionControl: false }).setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    if (ngos.length > 1) map.setView([lat, lng], 11);
    ngos.forEach(ngo => {
      const marker = L.marker([ngo.lat, ngo.lng])
        .bindPopup(ngo.name, { className: 'font-semibold' })
        .addTo(map)
        .on('click', () => setSelectedNgoId(ngo.id));
      if (ngo.id === selectedNgoId) marker.openPopup();
    });
    mapRef.current = map;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [currentStep, viewMode, ngos, selectedNgoId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLogistics({ ...logistics, contactPhone: val });
  };

  const renderStep1 = () => (
    <>
        <div className="px-0 mt-6 mb-2">
            <h2 className="text-xl font-bold text-[#212121] dark:text-white">Select Items to Donate</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Only safe, non-expired food can be donated. Unsafe or expired items are hidden.</p>
        </div>
        <div className="mb-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl glass-card border border-amber-200/50 dark:border-amber-700/50">
                <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Safe food only</p>
                    <p className="mt-0.5">We never allow expired or spoiled food to be donated. Only items that are safe to consume are shown here.</p>
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-[100px]">
            {donatableItems.length > 0 ? (
                donatableItems.map(item => (
                    <DonationItemRow key={item.id} item={item} selected={selectedItems.includes(item.id)} onToggle={handleToggleItem} />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center pt-16 px-8 text-center">
                     <ShoppingBag size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                     <h3 className="text-base font-semibold text-[#212121] dark:text-white mb-2">No safe food items available</h3>
                     <p className="text-sm text-slate-500 mb-6">Expired or unsafe food cannot be donated. Only non-expired, good-condition items appear here to protect recipients.</p>
                     <button onClick={() => navigate('/inventory')} className="bg-[#00796B] text-white h-12 px-6 rounded-2xl font-semibold shadow-lg shadow-teal-500/30">Check Inventory</button>
                </div>
            )}
        </div>
    </>
  );

  const renderStep2 = () => (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="px-4 mt-6 mb-4 flex justify-between items-end shrink-0">
             <div>
                <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">Choose Recipient</h2>
                <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">Who receives this donation?</p>
             </div>
             <div className="flex glass-card p-1 rounded-2xl border border-white/40 dark:border-white/10">
                 <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#00796B] text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/10'}`}><List size={20} /></button>
                 <button onClick={() => setViewMode('map')} className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-[#00796B] text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/10'}`}><MapIcon size={20} /></button>
             </div>
        </div>
        {viewMode === 'list' ? (
          <div className="flex-1 min-h-0 overflow-y-auto pb-[100px]">
            {loadingNGOs && <div className="px-4 mb-4 flex items-center gap-2 text-[#00796B]"><Loader2 className="animate-spin" size={16} /><span className="text-sm">Finding nearby organizations...</span></div>}
            {showNgoApiKeyHint && (
                <div className="px-4 mb-3 flex items-center justify-between gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                    <span>Add <code className="font-mono text-xs bg-black/10 px-1 rounded">GEMINI_API_KEY</code> to .env.local and Vercel env to load real NGOs.</span>
                    <button type="button" onClick={() => setShowNgoApiKeyHint(false)} className="shrink-0 text-amber-600 hover:text-amber-800" aria-label="Dismiss">×</button>
                </div>
            )}
            <div className="px-4 space-y-3">
                {ngos.map(ngo => (
                    <div key={ngo.id} onClick={() => setSelectedNgoId(ngo.id)} className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer flex justify-between items-center ${selectedNgoId === ngo.id ? 'border-[#00796B] ring-2 ring-[#00796B]/20' : 'border-white/40 dark:border-white/10 hover:border-[#00796B]/40'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-[600] text-[#212121] dark:text-white">{ngo.name}</h3>
                                {ngo.urgency === 'High' && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10} /> High Need</span>}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] text-[#757575]"><span className="flex items-center gap-1"><MapPin size={12} /> {ngo.distance}</span><span>•</span><span>{ngo.description || ngo.name}</span></div>
                        </div>
                        {selectedNgoId === ngo.id ? <div className="w-6 h-6 rounded-full bg-[#00796B] flex items-center justify-center shrink-0"><Check size={14} color="white" strokeWidth={3} /></div> : <div className="w-6 h-6 rounded-full border-2 border-[#E0E0E0] shrink-0" />}
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[320px] flex flex-col">
            <div ref={mapContainerRef} className="flex-1 w-full min-h-[320px] rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800" />
          </div>
        )}
    </div>
  );

  const renderStep3 = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      return (
        <div className="flex-1 overflow-y-auto px-[16px] pb-[100px]">
            <div className="mt-6 mb-5">
                <h2 className="text-xl font-bold text-[#212121] dark:text-white">Coordinate Handover</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review items and logistics for {selectedNgo?.name}.</p>
            </div>

            <div className="glass-card border border-white/40 dark:border-white/10 rounded-2xl p-5 mb-6">
                <h3 className="text-xs font-bold text-[#00796B] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={14} /> Shared Receipt Info for NGO
                </h3>
                <div className="space-y-2">
                    {selectedFoodObjects.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold text-[#212121] dark:text-white">{item.name}</span>
                            <div className="text-right">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Expires On</span>
                                <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                                    {new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => setLogistics({...logistics, mode: 'dropoff'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${logistics.mode === 'dropoff' ? 'bg-[#00796B] border-[#00796B] text-white shadow-lg shadow-teal-500/30' : 'glass-card border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'}`}><MapPin size={24} /><span className="font-bold text-sm">I'll Drop Off</span></button>
                <button onClick={() => setLogistics({...logistics, mode: 'pickup'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${logistics.mode === 'pickup' ? 'bg-[#00796B] border-[#00796B] text-white shadow-lg shadow-teal-500/30' : 'glass-card border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'}`}><Truck size={24} /><span className="font-bold text-sm">Request Pickup</span></button>
            </div>

            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Phone size={16} /> Contact Phone</span>
                    <span className={`text-[10px] font-bold ${logistics.contactPhone.length === 10 ? 'text-green-600' : 'text-slate-400'}`}>
                      {logistics.contactPhone.length}/10 digits
                    </span>
                  </label>
                  <input 
                    type="tel" 
                    placeholder="Enter 10 digit number" 
                    value={logistics.contactPhone} 
                    onChange={handlePhoneChange} 
                    className={`w-full h-12 px-4 rounded-2xl glass-input text-[#212121] dark:text-white outline-none transition-all font-medium focus:ring-2 focus:ring-[#00796B]/30 ${logistics.contactPhone.length > 0 && logistics.contactPhone.length < 10 ? 'border-orange-300' : ''}`} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold mb-2 flex items-center gap-2 text-[#212121] dark:text-white"><Calendar size={16} /> Date</label><input type="date" value={logistics.date} onChange={(e) => setLogistics({...logistics, date: e.target.value})} className="w-full h-12 px-4 rounded-2xl glass-input text-[#212121] dark:text-white outline-none transition-all font-medium focus:ring-2 focus:ring-[#00796B]/30" /></div>
                    <div><label className="block text-sm font-bold mb-2 flex items-center gap-2 text-[#212121] dark:text-white"><Clock size={16} /> Time</label><input type="time" value={logistics.time} onChange={(e) => setLogistics({...logistics, time: e.target.value})} className="w-full h-12 px-4 rounded-2xl glass-input text-[#212121] dark:text-white outline-none transition-all font-medium focus:ring-2 focus:ring-[#00796B]/30" /></div>
                </div>
                <div><label className="block text-sm font-bold mb-2 flex items-center gap-2 text-[#212121] dark:text-white"><MessageSquare size={16} /> Notes</label><textarea placeholder="Details for the recipient..." value={logistics.notes} onChange={(e) => setLogistics({...logistics, notes: e.target.value})} className="w-full h-20 p-4 rounded-2xl glass-input text-[#212121] dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 outline-none transition-all font-medium resize-none focus:ring-2 focus:ring-[#00796B]/30" /></div>
            </div>
            <div className="mt-6 p-4 glass-card rounded-2xl border border-blue-200/50 dark:border-blue-800/50 flex items-start gap-3"><AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" /><p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">When you confirm, we'll open your email app with <strong>full handover details</strong> for <strong>{selectedNgo?.name}</strong>: this item list with expiry dates, your contact, date/time, and notes. Send the email so the NGO receives everything they need.</p></div>

            {/* Mandatory safety confirmation */}
            <div className="mt-6 p-4 rounded-2xl glass-card border border-white/40 dark:border-white/10">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={safetyConfirmed}
                        onChange={(e) => setSafetyConfirmed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-[#00796B] focus:ring-[#00796B]"
                    />
                    <span className="text-sm text-[#212121] dark:text-slate-200 group-hover:text-[#00796B] transition-colors">
                        I confirm that this food is <strong>safe to consume</strong>, has been stored correctly, and is <strong>not damaged, spoiled, or contaminated</strong>. I will not deliver expired or unsafe food to the NGO.
                    </span>
                </label>
            </div>
        </div>
      );
  }

  const renderStep4 = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      const statusMessage = emailSent && selectedNgo
        ? { type: 'success' as const, title: 'Email sent to NGO', body: `${selectedNgo.name} has received the full handover details (your contact, items with expiry, date/time & notes). They may call you to coordinate.` }
        : emailError
        ? { type: 'warning' as const, title: 'Send the email manually', body: 'We couldn\'t send automatically. Your email app was opened with the details—please send that message to notify the NGO.' }
        : handoverEmailOpened && selectedNgo?.email
        ? { type: 'warning' as const, title: 'One more step', body: `We opened your email app. Send the message to ${selectedNgo.name} so they get your contact, item list and handover details.` }
        : !selectedNgo?.email && lastHandoverSummaryText
        ? { type: 'info' as const, title: 'Share the details', body: 'This NGO has no email on file. Copy the summary below and send it to them via WhatsApp, SMS or phone.' }
        : { type: 'success' as const, title: 'Handover details ready', body: 'The NGO will receive your contact, items with expiry, date/time and notes. They may reach out to coordinate.' };

      return (
          <div className="flex-1 flex flex-col items-center p-6 text-center animate-scale-in overflow-y-auto pb-28">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-5 shrink-0 animate-success-pop">
                <Check size={40} className="text-green-600 dark:text-green-400" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-[#212121] dark:text-white mb-1">Donation confirmed</h2>
              <p className="text-sm text-[#757575] dark:text-slate-400 mb-5 max-w-sm">Your donation to {selectedNgo?.name ?? 'the NGO'} is recorded.</p>

              <div className={`w-full max-w-sm rounded-2xl p-4 mb-6 text-left ${
                statusMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                statusMessage.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
              }`}>
                <p className="text-sm font-semibold text-[#212121] dark:text-white mb-1">{statusMessage.title}</p>
                <p className="text-xs text-[#757575] dark:text-slate-400 leading-relaxed">{statusMessage.body}</p>
              </div>

              <p className="text-xs text-[#757575] dark:text-slate-500 mb-5 max-w-sm">What happens next? They have your phone number and can contact you to arrange drop-off or pickup.</p>

              <div className="w-full max-w-sm space-y-3">
                {lastHandoverSummaryText && (
                  <button type="button" onClick={handleCopyHandoverSummary} className="w-full h-[48px] border-2 border-[#00796B] text-[#00796B] dark:border-teal-400 dark:text-teal-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00796B]/10 dark:hover:bg-teal-500/10 transition-colors">
                    <Copy size={18} /> {copyFeedback ? 'Copied!' : 'Copy handover summary'}
                  </button>
                )}
                <button onClick={() => navigate('/')} className="w-full h-[52px] bg-[#00796B] rounded-xl text-white font-bold shadow-lg hover:bg-[#00695C] transition-colors">
                  Back to Dashboard
                </button>
                {selectedNgo && (
                  <div className="flex gap-3 pt-1">
                    {selectedNgo.phone && (
                      <a href={`tel:${selectedNgo.phone.replace(/\s/g, '')}`} className="flex-1 h-[48px] border border-[#00796B] text-[#00796B] dark:border-teal-400 dark:text-teal-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00796B]/10 transition-colors text-sm">
                        <Phone size={18} /> Call
                      </a>
                    )}
                    {selectedNgo.email && (
                      <a href={`mailto:${selectedNgo.email}`} className="flex-1 h-[48px] border border-[#00796B] text-[#00796B] dark:border-teal-400 dark:text-teal-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00796B]/10 transition-colors text-sm">
                        <Mail size={18} /> Email
                      </a>
                    )}
                  </div>
                )}
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 flex flex-col relative">
      {currentStep < 4 && (
        <header className="pt-[12px] px-[16px] flex flex-col items-center relative z-20 bg-white dark:bg-slate-950">
            <div className="w-full h-[44px] flex items-center justify-between"><button onClick={handleBack} className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:bg-slate-100 transition-colors"><ChevronLeft size={24} className="dark:text-white" /></button><h1 className="text-[18px] font-[700] absolute left-0 right-0 text-center pointer-events-none dark:text-white">{currentStep === 1 ? 'Select Safe Food' : currentStep === 2 ? 'Choose Recipient' : 'Coordinate Handover'}</h1><div className="w-[44px]" /></div>
        </header>
      )}
      {currentStep < 4 && <Stepper currentStep={currentStep} />}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {(donatableItems.length > 0 && currentStep < 4) && (
          <div className="absolute bottom-4 left-4 right-4 md:left-8 md:right-8 rounded-2xl glass-panel pt-4 pb-6 px-4 z-30 border border-white/40 dark:border-white/10">
              <button 
                onClick={() => handleContinue()} 
                disabled={sendingEmail || (currentStep === 1 && selectedItems.length === 0) || (currentStep === 2 && !selectedNgoId) || (currentStep === 3 && (!isPhoneValid || !logistics.date || !logistics.time || !safetyConfirmed))} 
                className="w-full h-14 bg-[#00796B] rounded-2xl flex items-center justify-center text-white text-[16px] font-semibold shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {sendingEmail ? 'Sending email…' : currentStep === 3 ? (!safetyConfirmed ? 'Confirm food is safe' : isPhoneValid ? 'Confirm Handover Info' : 'Enter 10 Digit Phone') : 'Continue'}
              </button>
          </div>
      )}
    </div>
  );
};

export default Donation;