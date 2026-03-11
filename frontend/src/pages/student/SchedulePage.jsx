import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle,
  Video, MapPin, Phone, Mail, AlertTriangle, Sparkles
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  'Academic Stress',
  'Anxiety',
  'Depression',
  'Relationship Issues',
  'Family Problems',
  'Grief & Loss',
  'Career Counseling',
  'Financial Stress',
  'Substance Use',
  'Self-Esteem',
  'Trauma',
  'Other',
];

const SchedulePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromURL = searchParams.get('category');

  const [category, setCategory] = useState(categoryFromURL || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [meetingType, setMeetingType] = useState('in-person');
  const [notes, setNotes] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const token = () => localStorage.getItem('token');

  const readyToSuggest = category && selectedDate && selectedTime && meetingType;

  useEffect(() => {
    fetchCounselors();
    fetchEmergencyContacts();
  }, []);

  useEffect(() => {
    if (selectedCounselor && selectedDate) fetchBookedSlots();
  }, [selectedCounselor, selectedDate]);

  useEffect(() => {
    if (readyToSuggest) fetchSuggestions();
  }, [category, selectedDate, selectedTime, meetingType]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    setSelectedCounselor('');
    try {
      const params = new URLSearchParams({ category, limit: 3 });
      const res = await fetch(`${API}/api/counselors/suggest?${params}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        if (data.length > 0) setSelectedCounselor(String(data[0].id));
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const res = await fetch(`${API}/api/counselors/available`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setCounselors(await res.json());
    } catch (err) {
      console.error('Failed to fetch counselors:', err);
    }
  };

  const fetchEmergencyContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch(`${API}/api/emergency-contacts/`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setEmergencyContacts(await res.json());
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const res = await fetch(
        `${API}/api/schedules/booked-slots?counselor_id=${selectedCounselor}&date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (res.ok) setBookedSlots(await res.json());
    } catch (err) {
      console.error('Failed to fetch booked slots:', err);
    }
  };

  const isSlotBooked = (time) =>
    bookedSlots.some(slot => new Date(slot.scheduled_at).toTimeString().substring(0, 5) === time);

  const isSlotPast = (date, time) => new Date(`${date}T${time}`) < new Date();

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCounselor || !selectedDate || !selectedTime || !category) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/schedules/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          counselor_id: parseInt(selectedCounselor),
          scheduled_at: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
          duration_minutes: 60,
          meeting_type: meetingType,
          notes: notes || null
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to schedule appointment');
      }
      setSuccess(true);
      setTimeout(() => navigate('/student/dashboard'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Scheduled!</h2>
          <p className="text-gray-600 mb-6">Your appointment has been successfully booked.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Schedule a Session</h2>
                  <p className="text-gray-600">Tell us what you need and when — we'll find the right counselor for you</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step 1 — What's bothering you */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to talk about? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setSuggestions([]); setSelectedCounselor(''); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select a concern...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Step 2 — Date & Meeting type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setSuggestions([]); setSelectedCounselor(''); }}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Sessions can be booked 1–30 days in advance</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={meetingType}
                      onChange={(e) => { setMeetingType(e.target.value); setSuggestions([]); setSelectedCounselor(''); }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="in-person">In-Person</option>
                      <option value="virtual">Virtual (Online)</option>
                    </select>
                  </div>
                </div>

                {/* Step 3 — Time slot */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {timeSlots.map((time) => {
                        const isPast = isSlotPast(selectedDate, time);
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => { if (!isPast) { setSelectedTime(time); setSuggestions([]); setSelectedCounselor(''); } }}
                            disabled={isPast}
                            className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                              selectedTime === time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : isPast
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            <Clock className="w-4 h-4 inline mr-1" />
                            {time}
                            {isPast && <span className="block text-xs mt-1">Past</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Each session is 60 minutes.</p>
                  </div>
                )}

                {/* Step 4 — Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything specific you'd like the counselor to know beforehand..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Step 5 — Suggestions appear after all inputs are filled */}
                {readyToSuggest && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-semibold text-gray-700">
                        Recommended counselors for you
                      </p>
                    </div>

                    {loadingSuggestions ? (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        <p className="text-sm text-blue-700">Finding the best match...</p>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="space-y-3">
                        {suggestions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => setSelectedCounselor(String(s.id))}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                              selectedCounselor === String(s.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900">{s.full_name}</p>
                                  {selectedCounselor === String(s.id) && (
                                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Selected</span>
                                  )}
                                </div>
                                {s.match_reasons.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {s.match_reasons.map((reason, i) => (
                                      <span
                                        key={i}
                                        className="text-xs bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full"
                                      >
                                        {reason}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                        No suggestions found. Please select a counselor manually below.
                      </p>
                    )}
                  </div>
                )}

                {/* Step 6 — Manual counselor override */}
                {readyToSuggest && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {suggestions.length > 0 ? 'Or choose a different counselor' : 'Select a Counselor'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCounselor}
                      onChange={(e) => setSelectedCounselor(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Choose a counselor...</option>
                      {counselors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name}
                          {suggestions.find(s => s.id === c.id) ? ' ★ Recommended' : ''}
                        </option>
                      ))}
                    </select>

                    {selectedCounselor && (
                      <div className="mt-2 text-xs text-gray-500">
                        {(() => {
                          const booked = bookedSlots.some(slot =>
                            new Date(slot.scheduled_at).toTimeString().substring(0, 5) === selectedTime
                          );
                          return booked
                            ? <span className="text-red-500">This counselor is not available at {selectedTime} on the selected date. Please pick another time or counselor.</span>
                            : <span className="text-green-600">This counselor is available at your selected time.</span>;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {meetingType === 'in-person' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">In-Person Location</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Student Counseling Center, Main Campus Building, 2nd Floor, Room 204
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {meetingType === 'virtual' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Video className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-900">Virtual Meeting</p>
                        <p className="text-sm text-purple-700 mt-1">
                          A meeting link will be sent to your email before the session
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Need help choosing a counselor?</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Visit the Reception Desk at the Counseling Center — Main Campus, 2nd Floor, Room 200.
                      </p>
                      <a
                        href="tel:+254712345678"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-yellow-900 underline hover:text-yellow-700"
                      >
                        <Phone className="w-4 h-4" /> Call Reception: +254 712 345 678
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedCounselor || !selectedDate || !selectedTime || !category}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      Schedule Session
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-500" />
                Emergency Contacts
              </h3>
              <p className="text-xs text-gray-500 mb-4">Your saved contacts for quick reference.</p>

              {loadingContacts ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : emergencyContacts.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
                  <p className="text-sm text-red-800 font-medium mb-2">No emergency contacts saved</p>
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="text-sm text-red-700 underline hover:text-red-900"
                  >
                    Add contacts on Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {emergencyContacts.map((contact) => (
                    <div key={contact.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm">{contact.contact_name}</p>
                        {contact.is_primary && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{contact.contact_relationship}</p>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />{contact.phone_number}
                      </div>
                      {contact.email && (
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <Mail className="h-3 w-3 mr-1" />{contact.email}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 mb-2">In Crisis?</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-red-900">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Kenya Red Cross: 1199</span>
                    </div>
                    <div className="flex items-center text-red-900">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Befrienders Kenya: 0722 178 177</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;