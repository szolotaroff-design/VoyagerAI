
import React, { useState, useEffect } from 'react';
import { AppView, Trip } from './types';
import TripCard from './components/TripCard';
import ItineraryView from './components/ItineraryView';
import TripPlanner from './components/TripPlanner';
import FeedbackModal from './components/FeedbackModal';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ amount: string; callback: () => void } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(false);

  useEffect(() => {
    // Load trips
    const savedTrips = localStorage.getItem('voyager_trips');
    if (savedTrips) {
      try {
        setTrips(JSON.parse(savedTrips));
      } catch (e) {
        console.error("Failed to load trips", e);
      }
    }

    // Load trial status (independent of trips list)
    const trialStatus = localStorage.getItem('voyager_free_trial_used');
    if (trialStatus === 'true') {
      setFreeTrialUsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('voyager_trips', JSON.stringify(trips));
  }, [trips]);

  const handleTripGenerated = (newTrip: Trip) => {
    // If trial is NOT used yet, let them through for free once
    if (!freeTrialUsed) {
      finalizeTripGeneration(newTrip);
      // Mark trial as used permanently
      setFreeTrialUsed(true);
      localStorage.setItem('voyager_free_trial_used', 'true');
    } else {
      // Trial used, show payment modal
      setPaymentModal({
        amount: '$2.99',
        callback: () => finalizeTripGeneration(newTrip)
      });
    }
  };

  const finalizeTripGeneration = (newTrip: Trip) => {
    setTrips(prev => [newTrip, ...prev]);
    setSelectedTrip(newTrip);
    setView('TRIP_DETAILS');
    setPaymentModal(null);
  };

  const handleTripUpdate = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setSelectedTrip(updatedTrip);
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setView('TRIP_DETAILS');
  };

  const deleteTrip = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const processPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      paymentModal?.callback();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
              <i className="fas fa-credit-card text-2xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Unlock Journey</h2>
            <p className="text-slate-500 mb-8">You've reached the limit of free plans. Pay once to unlock this full itinerary forever.</p>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Total</span>
              <span className="text-3xl font-black text-slate-800">{paymentModal.amount}</span>
            </div>
            <button 
              onClick={processPayment}
              disabled={isProcessingPayment}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
            >
              {isProcessingPayment ? <i className="fas fa-circle-notch animate-spin"></i> : "Pay Now"}
            </button>
            <button onClick={() => setPaymentModal(null)} className="mt-4 text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <i className="fas fa-globe-americas text-white text-lg"></i>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">Voyager<span className="text-blue-600">AI</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="p-3 text-slate-400 hover:text-blue-600 transition-colors hidden sm:block"
              title="Feedback"
            >
              <i className="fas fa-comment-dots text-xl"></i>
            </button>
            <button 
              onClick={() => setView('PLANNER')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
            >
              <i className="fas fa-plus"></i> <span className="hidden sm:inline">Plan Trip</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'DASHBOARD' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">My Adventures</h1>
                <p className="text-slate-500">Your AI-curated travel experiences.</p>
              </div>
              <button 
                onClick={() => setIsFeedbackOpen(true)}
                className="sm:hidden flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm"
              >
                <i className="fas fa-comment-dots text-blue-500"></i> Send Feedback
              </button>
            </div>
            {trips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {trips.map(trip => (
                  <TripCard key={trip.id} trip={trip} onClick={handleTripClick} onDelete={deleteTrip} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <i className="fas fa-map-marked-alt text-4xl text-slate-200 mb-6"></i>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No trips yet</h2>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => setView('PLANNER')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">Create New Plan</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'PLANNER' && (
          <TripPlanner 
            onTripGenerated={handleTripGenerated}
            onCancel={() => setView('DASHBOARD')}
            isPayable={freeTrialUsed}
          />
        )}

        {view === 'TRIP_DETAILS' && selectedTrip && (
          <ItineraryView 
            trip={selectedTrip} 
            onBack={() => setView('DASHBOARD')}
            onUpdateTrip={handleTripUpdate}
            onPaymentRequired={(amount, callback) => setPaymentModal({ amount, callback })}
          />
        )}
      </main>
      
      {/* Floating feedback button for desktop */}
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <button 
          onClick={() => setIsFeedbackOpen(true)}
          className="group flex items-center gap-3 bg-white hover:bg-blue-600 text-slate-600 hover:text-white px-5 py-4 rounded-3xl shadow-2xl border border-slate-100 transition-all active:scale-95"
        >
          <i className="fas fa-headset text-xl text-blue-500 group-hover:text-white"></i>
          <span className="font-bold text-sm">Support & Feedback</span>
        </button>
      </div>
    </div>
  );
};

export default App;
