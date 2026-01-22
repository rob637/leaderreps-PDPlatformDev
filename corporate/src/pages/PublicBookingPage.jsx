import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, Clock, CheckCircle, User, 
  ChevronLeft, ChevronRight, Globe, Loader
} from 'lucide-react';
import { doc, getDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const PublicBookingPage = () => {
    const { userId } = useParams();
    const [host, setHost] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Booking State
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [guestInfo, setGuestInfo] = useState({ name: '', email: '', notes: '' });
    const [bookingComplete, setBookingComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load Host Configuration
    useEffect(() => {
        const fetchHostConfig = async () => {
            if (!userId) {
                setError("Invalid booking link.");
                setLoading(false);
                return;
            }

            try {
                // 1. Get Host Profile (for name/avatar)
                // Assuming 'users' collection has profiles. If restricted, we might fail here.
                // For MVP corporate tool, we assume public read or specific rules allow this.
                // Alternatively, we store public profile in 'scheduler_profiles'
                
                // Fallback: Just fetch the scheduler config directly and assume userId is the doc ID
                const configRef = doc(db, 'users', userId, 'settings', 'scheduler');
                const configSnap = await getDoc(configRef);

                if (!configSnap.exists()) {
                    setError("This user has not set up their booking page yet.");
                } else {
                    setConfig(configSnap.data());
                    // Mock host name if we can't fetch profile easily
                    setHost({ name: "Team Member", avatar: null }); 
                }
            } catch (err) {
                console.error("Error loading booking page:", err);
                setError("Unable to load booking configuration.");
            } finally {
                setLoading(false);
            }
        };

        fetchHostConfig();
    }, [userId]);

    // Generate Slots Logic (Simplified for MVP)
    const getSlotsForDate = (date) => {
        if (!config || !config.availability) return [];
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayConfig = config.availability[dayName];

        if (!dayConfig || !dayConfig.enabled) return [];

        const slots = [];
        let [startHour, startMin] = dayConfig.start.split(':').map(Number);
        let [endHour, endMin] = dayConfig.end.split(':').map(Number);
        
        // Create 30min slots
        let current = new Date(date);
        current.setHours(startHour, startMin, 0);
        
        const end = new Date(date);
        end.setHours(endHour, endMin, 0);

        while (current < end) {
            slots.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            current.setMinutes(current.getMinutes() + 30);
        }

        return slots;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await addDoc(collection(db, 'corporate_bookings'), {
                hostId: userId,
                guestName: guestInfo.name,
                guestEmail: guestInfo.email,
                notes: guestInfo.notes,
                date: selectedDate.toISOString(),
                time: selectedSlot,
                status: 'confirmed', // Auto-confirm for MVP
                createdAt: new Date()
            });
            setBookingComplete(true);
        } catch (err) {
            console.error("Booking failed:", err);
            alert("Failed to book slot. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- RENDER ---

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
                        <User className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Oops!</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (bookingComplete) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-200">
                    <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-corporate-navy mb-2">Booking Confirmed!</h1>
                    <p className="text-slate-600 mb-6">
                        You are scheduled with {host.name} on <br/>
                        <span className="font-bold text-slate-800">
                            {selectedDate.toLocaleDateString()} at {selectedSlot}
                        </span>
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-500 mb-6">
                        A calendar invitation has been sent to <b>{guestInfo.email}</b>.
                    </div>
                    <button onClick={() => window.location.reload()} className="text-corporate-teal font-medium hover:underline">
                        Book another time
                    </button>
                </div>
            </div>
        );
    }

    // Main Selection View
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                
                {/* Left: Host Info */}
                <div className="md:w-1/3 bg-slate-50 border-r border-slate-200 p-8 flex flex-col">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 shadow-md">
                            LR
                        </div>
                        <h2 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Scheduling with</h2>
                        <h1 className="text-2xl font-bold text-corporate-navy mt-1">LeaderReps Team</h1>
                    </div>
                    
                    <div className="space-y-4 text-slate-600">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <span>30 min meeting</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-slate-400" />
                            <span>Video call details provided upon confirmation</span>
                        </div>
                    </div>
                </div>

                {/* Right: Date/Time Picker */}
                <div className="md:w-2/3 p-8">
                    {!selectedSlot ? (
                        <>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Select a Date & Time</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Simple Date Strips (Mock Calendar) */}
                                <div>
                                    <h3 className="font-bold text-sm text-slate-500 mb-3">January 2026</h3>
                                    <div className="space-y-2">
                                        {[22, 23, 24, 25, 26, 27].map(day => {
                                            const d = new Date(2026, 0, day); // Jan 2026
                                            const isSelected = selectedDate?.getDate() === day;
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                                                    className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-all ${
                                                        isSelected 
                                                            ? 'bg-corporate-teal text-white shadow-md' 
                                                            : 'bg-white border border-slate-200 hover:border-corporate-teal hover:bg-teal-50 text-slate-700'
                                                    }`}
                                                >
                                                    <span className="font-medium">
                                                        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div>
                                    <h3 className="font-bold text-sm text-slate-500 mb-3">Available Times</h3>
                                    {!selectedDate ? (
                                        <div className="text-slate-400 text-sm italic py-4">Choose a date first</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                                            {getSlotsForDate(selectedDate).length > 0 ? (
                                                getSlotsForDate(selectedDate).map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className="w-full text-center py-2 border border-corporate-teal text-corporate-teal rounded-lg font-medium hover:bg-corporate-teal hover:text-white transition-colors"
                                                    >
                                                        {slot}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-slate-400 text-sm">No slots available</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // Guest Form
                        <div className="animate-fade-in">
                            <button 
                                onClick={() => setSelectedSlot(null)}
                                className="flex items-center gap-1 text-slate-400 hover:text-corporate-navy text-sm font-medium mb-6"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back to times
                            </button>

                            <h2 className="text-xl font-bold text-slate-800 mb-2">Enter Details</h2>
                            <p className="text-slate-500 mb-6">
                                {selectedDate.toLocaleDateString()} at {selectedSlot}
                            </p>

                            <form onSubmit={handleBooking} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={guestInfo.name}
                                        onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-corporate-teal outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                    <input 
                                        required
                                        type="email" 
                                        value={guestInfo.email}
                                        onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-corporate-teal outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
                                    <textarea 
                                        rows="3"
                                        value={guestInfo.notes}
                                        onChange={(e) => setGuestInfo({...guestInfo, notes: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-corporate-teal outline-none"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-corporate-navy text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    {submitting ? 'Confirming...' : 'Schedule Event'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="fixed bottom-4 text-slate-400 text-xs text-center w-full">
                Powered by LeaderReps Scheduler
            </div>
        </div>
    );
};

export default PublicBookingPage;
