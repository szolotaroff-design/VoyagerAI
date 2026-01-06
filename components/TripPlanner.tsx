
import React, { useState, useRef } from 'react';
import { generateTripPlan } from '../services/geminiService';
import { Trip, TripRequest } from '../types';

interface TripPlannerProps {
  onTripGenerated: (trip: Trip) => void;
  onCancel: () => void;
  isPayable: boolean;
}

const TripPlanner: React.FC<TripPlannerProps> = ({ onTripGenerated, onCancel, isPayable }) => {
  const [step, setStep] = useState(1);
  const [showDestHint, setShowDestHint] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<TripRequest>({
    departureLocation: '',
    destinations: [''],
    startDate: today,
    endDate: '',
    transportType: 'Cheapest available',
    totalBudget: '2000',
    goals: ''
  });
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const handleDestinationChange = (index: number, value: string) => {
    const newDests = [...formData.destinations];
    newDests[index] = value;
    setFormData({ ...formData, destinations: newDests });
  };

  const addDestination = () => {
    setFormData({ ...formData, destinations: [...formData.destinations, ''] });
  };

  const removeDestination = (index: number) => {
    if (formData.destinations.length <= 1) return;
    const newDests = formData.destinations.filter((_, i) => i !== index);
    setFormData({ ...formData, destinations: newDests });
  };

  const handleStartDateChange = (val: string) => {
    const newEndDate = formData.endDate && formData.endDate < val ? val : formData.endDate;
    setFormData({ ...formData, startDate: val, endDate: newEndDate });
  };

  const handlePlanTrip = async () => {
    setIsPlanning(true);
    setError(null);
    try {
      const trip = await generateTripPlan(formData);
      onTripGenerated(trip);
    } catch (err: any) {
      setError(err.message || 'Error planning your trip. Please try again.');
      setIsPlanning(false);
    }
  };

  const transportOptions = [
    { id: 'Own car', icon: 'fa-car-side', label: 'Car' },
    { id: 'Plane', icon: 'fa-plane', label: 'Flight' },
    { id: 'Train', icon: 'fa-train', label: 'Train' },
    { id: 'Bus', icon: 'fa-bus', label: 'Bus' },
    { id: 'Rental car', icon: 'fa-car', label: 'Rental' },
    { id: 'Cheapest available', icon: 'fa-tags', label: 'Budget' },
    { id: 'Public transport', icon: 'fa-users', label: 'Public' }
  ];

  if (isPlanning) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] p-12 max-w-lg w-full shadow-2xl text-center border border-white/20">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-8 border-blue-50 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-8 border-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-globe-europe text-4xl text-blue-600"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Voyager is working...</h2>
          <p className="text-slate-500 mb-8 italic">"Finding the best flights and hotels for your route to {formData.destinations.filter(d => d).join(', ')}"</p>
          <div className="space-y-4 max-w-xs mx-auto text-left">
            <div className="flex items-center text-slate-600 animate-bounce delay-75">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3"><i className="fas fa-check text-xs text-green-600"></i></div>
              <span className="text-sm font-bold">Mapping route...</span>
            </div>
            <div className="flex items-center text-slate-600 animate-bounce delay-150">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3"><i className="fas fa-search text-xs text-blue-600"></i></div>
              <span className="text-sm font-bold">Fetching live booking links...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isStep1Valid = formData.departureLocation.trim() !== '' && formData.destinations.some(d => d.trim() !== '') && formData.endDate !== '';

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10 opacity-50"></div>
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">New Adventure</h2>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'w-8 bg-blue-600' : 'w-4 bg-slate-200'}`}></div>
              ))}
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {isPayable && step === 1 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
              <i className="fas fa-credit-card"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Premium Plan: $2.99</p>
              <p className="text-xs text-blue-600">Free trial used. Payment required to unlock your next plan.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start border border-red-100">
            <i className="fas fa-exclamation-circle mt-1 mr-2"></i>
            {error}
          </div>
        )}

        {/* Step 1: Where and When */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Starting Point</label>
              <div className="relative">
                <i className="fas fa-house absolute left-5 top-1/2 -translate-y-1/2 text-blue-500"></i>
                <input
                  type="text"
                  value={formData.departureLocation}
                  onChange={(e) => setFormData({...formData, departureLocation: e.target.value})}
                  placeholder="E.g. New York, NY or San Francisco, CA"
                  className="w-full p-5 pl-14 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-lg font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Destinations</label>
                <button 
                  onClick={() => setShowDestHint(!showDestHint)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-colors ${showDestHint ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  <i className="fas fa-question"></i>
                </button>
              </div>

              {showDestHint && (
                <div className="absolute left-0 right-0 top-10 z-20 p-5 bg-blue-600 text-white rounded-3xl shadow-2xl animate-fadeIn border border-blue-400">
                  <button 
                    onClick={() => setShowDestHint(false)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                  <p className="text-xs leading-relaxed">
                    <span className="font-black text-blue-100 block mb-1 uppercase tracking-wider text-[10px]">Voyager Advice</span>
                    You can enter specific city names (like <span className="font-bold underline">Paris</span>) or just describe what you're looking for, like <span className="font-bold">"Somewhere warm with nature"</span> or <span className="font-bold">"Best hiking spots in Europe"</span>. I'll research and build the route for you!
                  </p>
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-600 rotate-45 border-l border-t border-blue-400"></div>
                </div>
              )}

              <div className="space-y-4">
                {formData.destinations.map((dest, idx) => (
                  <div key={idx} className="relative group flex items-center gap-2">
                    <div className="relative flex-1">
                      <i className={`fas ${idx === 0 ? 'fa-map-pin' : 'fa-location-arrow'} absolute left-5 top-1/2 -translate-y-1/2 text-blue-500`}></i>
                      <input
                        type="text"
                        value={dest}
                        onChange={(e) => handleDestinationChange(idx, e.target.value)}
                        placeholder={idx === 0 ? "E.g. London, UK" : "Next city (e.g. Rome)"}
                        className="w-full p-5 pl-14 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-lg font-bold text-slate-800"
                      />
                    </div>
                    {formData.destinations.length > 1 && (
                      <button 
                        onClick={() => removeDestination(idx)}
                        className="p-4 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  onClick={addDestination}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-500 transition-all"
                >
                  <i className="fas fa-plus-circle"></i> Add city (multi-city tour)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Departure Date</label>
                <div 
                  className="relative p-5 rounded-2xl bg-slate-50 border-2 border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
                  onClick={() => startRef.current?.showPicker()}
                >
                  <input
                    ref={startRef}
                    type="date"
                    min={today}
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-transparent outline-none font-bold text-slate-800 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Return Date</label>
                <div 
                  className="relative p-5 rounded-2xl bg-slate-50 border-2 border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
                  onClick={() => endRef.current?.showPicker()}
                >
                  <input
                    ref={endRef}
                    type="date"
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-transparent outline-none font-bold text-slate-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => isStep1Valid && setStep(2)}
              disabled={!isStep1Valid}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
            >
              Next <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Goals & Preferences</label>
              <p className="text-slate-400 text-xs mb-4">Tell us more: who are you traveling with? What do you like to do?</p>
              <textarea
                value={formData.goals}
                onChange={(e) => setFormData({...formData, goals: e.target.value})}
                placeholder="E.g. Traveling with two kids (5 and 8). We love water parks and local food. Prefer hotels with pools."
                className="w-full h-48 p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all font-medium text-slate-800 resize-none shadow-inner"
              ></textarea>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all">Looks good, next</button>
            </div>
          </div>
        )}

        {/* Step 3: Transport & Budget */}
        {step === 3 && (
          <div className="space-y-12 animate-fadeIn">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Preferred Transport</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {transportOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormData({...formData, transportType: opt.id})}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                      formData.transportType === opt.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105 shadow-md' 
                        : 'border-slate-50 bg-white text-slate-400 hover:border-blue-100'
                    }`}
                  >
                    <i className={`fas ${opt.icon} text-xl`}></i>
                    <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <i className="fas fa-dollar-sign text-blue-600"></i>
                <label className="text-xl font-bold text-slate-800">Budget: ${Number(formData.totalBudget).toLocaleString()}</label>
              </div>
              
              <div className="relative pt-2">
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={formData.totalBudget}
                  onChange={(e) => setFormData({...formData, totalBudget: e.target.value})}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
                  <span>$500</span>
                  <span>$10,000</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs italic">Estimated total amount for the whole trip including flights and hotels.</p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all">Back</button>
              <button onClick={handlePlanTrip} className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-wand-magic-sparkles"></i> Create Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlanner;
