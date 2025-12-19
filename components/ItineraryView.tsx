
import React, { useState } from 'react';
import { Trip, DailyPlan, Activity } from '../types';
import { editTripPlan } from '../services/geminiService';

interface ItineraryViewProps {
  trip: Trip;
  onBack: () => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onPaymentRequired: (amount: string, callback: () => void) => void;
}

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  switch (type) {
    case 'FLIGHT': return <i className="fas fa-plane text-blue-500"></i>;
    case 'HOTEL': return <i className="fas fa-hotel text-indigo-500"></i>;
    case 'RESTAURANT': return <i className="fas fa-utensils text-orange-500"></i>;
    case 'SIGHTSEEING': return <i className="fas fa-camera text-green-500"></i>;
    case 'TRANSPORT': return <i className="fas fa-train text-slate-500"></i>;
    default: return <i className="fas fa-star text-yellow-500"></i>;
  }
};

const ItineraryView: React.FC<ItineraryViewProps> = ({ trip, onBack, onUpdateTrip, onPaymentRequired }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  
  // New Activity Form State
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: 'SIGHTSEEING',
    time: '12:00',
    title: '',
    description: '',
    location: ''
  });

  const getGoogleMapsRouteUrl = (location: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
  };

  const getBookingLink = (activity: Activity) => {
    const checkin = trip.startDate;
    const checkout = trip.endDate;
    
    // If AI provided a deep link already, use it
    if (activity.bookingUrl && activity.bookingUrl.trim() !== '' && !activity.bookingUrl.includes('google.com/search') && activity.bookingUrl.length > 15) {
      return activity.bookingUrl;
    }

    const highIntentTypes = ['FLIGHT', 'HOTEL', 'TRANSPORT'];
    if (highIntentTypes.includes(activity.type)) {
      if (activity.type === 'FLIGHT') {
        return `https://www.skyscanner.com/transport/flights/search?q=${encodeURIComponent(activity.title)}&departure_date=${checkin}`;
      }
      if (activity.type === 'HOTEL') {
        return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(activity.title + ' ' + (activity.location || ''))}&checkin=${checkin}&checkout=${checkout}`;
      }
      if (activity.type === 'TRANSPORT') {
        return `https://www.thetrainline.com/search/${encodeURIComponent(activity.location || '')}?departureDate=${checkin}`;
      }
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      dayMonth: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const currentEditCount = trip.editCount || 0;
  const isFreeEdit = currentEditCount < 2; 

  const handleEditTrip = async () => {
    if (!editPrompt.trim()) return;
    const performUpdate = async () => {
      setIsUpdating(true);
      try {
        const updated = await editTripPlan(trip, editPrompt);
        onUpdateTrip({ ...updated, editCount: currentEditCount + 1 });
        setIsEditing(false);
        setEditPrompt('');
      } catch (err) {
        alert("Failed to update trip.");
      } finally {
        setIsUpdating(false);
      }
    };
    if (isFreeEdit) performUpdate();
    else onPaymentRequired('$0.99', performUpdate);
  };

  const handleAddManualActivity = () => {
    if (!newActivity.title || !newActivity.time) return;
    
    const updatedItinerary = [...trip.itinerary];
    const targetDay = updatedItinerary[selectedDay];
    
    const activityToAdd: Activity = {
      title: newActivity.title,
      time: newActivity.time,
      description: newActivity.description || '',
      location: newActivity.location || '',
      type: (newActivity.type as Activity['type']) || 'OTHER',
      costEstimate: '',
      bookingUrl: ''
    };

    targetDay.activities = [...targetDay.activities, activityToAdd].sort((a, b) => a.time.localeCompare(b.time));
    
    onUpdateTrip({ ...trip, itinerary: updatedItinerary });
    setIsAddingActivity(false);
    setNewActivity({ type: 'SIGHTSEEING', time: '12:00', title: '', description: '', location: '' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-blue-600 transition-colors font-medium group">
          <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to list
        </button>
        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          <i className="fas fa-pen-to-square text-blue-500"></i> Edit Plan {isFreeEdit && <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-md uppercase">Free</span>}
        </button>
      </div>

      {/* Manual Add Activity Modal */}
      {isAddingActivity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-fadeIn border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Add New Activity</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time</label>
                  <input 
                    type="time" 
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="FLIGHT">Flight</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="SIGHTSEEING">Sightseeing</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dinner at Skyline"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location</label>
                <input 
                  type="text" 
                  placeholder="Address or name"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  placeholder="Any notes..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full h-24 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsAddingActivity(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleAddManualActivity} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200">Save Activity</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Adjust your trip</h3>
            <p className="text-slate-500 text-sm mb-6">{isFreeEdit ? `You have ${2 - currentEditCount} free edits left.` : 'Free edits exhausted. Further adjustments cost $0.99 each.'}</p>
            <textarea className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all resize-none mb-6" placeholder="E.g. Add one more day..." value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleEditTrip} disabled={isUpdating || !editPrompt.trim()} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-700 disabled:bg-slate-200">{isUpdating ? 'Updating...' : `Update Plan`}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100 mb-8">
        <div className="relative h-64 md:h-80">
          <img src={trip.imageUrl} alt={trip.destination} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{trip.name}</h1>
            <p className="text-white/90 text-lg flex items-center"><i className="fas fa-map-marker-alt mr-2 text-blue-400"></i> {trip.destination}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="border-b border-slate-100 mb-8 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 min-w-max pb-1">
              {trip.itinerary.map((day, idx) => {
                const { dayMonth, weekday } = formatDate(day.date);
                return (
                  <button key={day.day} onClick={() => setSelectedDay(idx)} className={`pb-4 px-4 transition-all relative flex flex-col items-center min-w-[80px] ${selectedDay === idx ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${selectedDay === idx ? 'opacity-100' : 'opacity-40'}`}>Day {day.day}</span>
                    <span className="text-sm font-bold capitalize">{weekday}, {dayMonth}</span>
                    {selectedDay === idx && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-50">
            {trip.itinerary[selectedDay].activities.map((activity, aIdx) => {
              const bookingLink = getBookingLink(activity);
              const hasMap = activity.location && activity.location.trim().length > 3;
              return (
                <div key={aIdx} className="relative pl-12 group/item">
                  <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm"><ActivityIcon type={activity.type} /></div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{activity.time}</span>
                      {activity.costEstimate && <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">{activity.costEstimate}</span>}
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">{activity.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{activity.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">{activity.location && <div className="flex items-center text-xs text-slate-400"><i className="fas fa-location-dot mr-1 text-slate-300"></i> {activity.location}</div>}</div>
                      <div className="flex flex-wrap gap-2">
                        {hasMap && <a href={getGoogleMapsRouteUrl(activity.location!)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all gap-2"><i className="fas fa-map-marked-alt"></i>Map</a>}
                        {bookingLink && <a href={bookingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md gap-2"><i className="fas fa-external-link-alt"></i>{activity.type === 'HOTEL' ? 'Book Stay' : 'Book Online'}</a>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Manual Add Trigger */}
            <div className="relative pl-12 pt-4">
              <button 
                onClick={() => setIsAddingActivity(true)}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all"
              >
                <i className="fas fa-plus-circle"></i> Add your own activity to Day {selectedDay + 1}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryView;
