import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, CheckCircle, AlertCircle, Video, MapPin } from 'lucide-react';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [meetingType, setMeetingType] = useState('in-person');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    fetchCounselors();
  }, []);

  useEffect(() => {
    if (selectedCounselor && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedCounselor, selectedDate]);

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/counselors/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCounselors(data);
      }
    } catch (error) {
      console.error('Error fetching counselors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/schedules/booked-slots?counselor_id=${selectedCounselor}&date=${selectedDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const isSlotBooked = (time) => {
    return bookedSlots.some(slot => {
      const slotDate = new Date(slot.scheduled_at);
      const slotTime = slotDate.toTimeString().substring(0, 5);
      return slotTime === time;
    });
  };

  const isSlotPast = (date, time) => {
    const slotDateTime = new Date(`${date}T${time}`);
    return slotDateTime < new Date();
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      console.log('Submitting schedule:', {
        counselor_id: parseInt(selectedCounselor),
        scheduled_at: scheduledAt,
        duration_minutes: 60,
        meeting_type: meetingType,
        notes: notes
      });

      const response = await fetch('http://localhost:8000/api/schedules/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          counselor_id: parseInt(selectedCounselor),
          scheduled_at: scheduledAt,
          duration_minutes: 60,
          meeting_type: meetingType,
          notes: notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to schedule appointment');
      }

      const result = await response.json();
      console.log('Schedule created successfully:', result);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Scheduling error:', error);
      setError(error.message);
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule a Session</h2>
              <p className="text-gray-600">Book an appointment with a counselor</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Counselor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCounselor || ''}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Choose a counselor...</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.full_name} - {counselor.department}
                  </option>
                ))}
              </select>

              {selectedCounselor && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                  {(() => {
                    const selected = counselors.find(c => c.id === parseInt(selectedCounselor));
                    return selected ? (
                      <div>
                        <p className="font-medium text-blue-900">{selected.full_name}</p>
                        <p className="text-sm text-blue-700 mt-1">{selected.bio}</p>
                        <p className="text-sm text-blue-600 mt-2">
                          <strong>Specializations:</strong> {selected.specializations.join(', ')}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                  }}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Sessions can be booked 1-30 days in advance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="in-person">In-Person</option>
                  <option value="virtual">Virtual (Online)</option>
                </select>
              </div>
            </div>

            {selectedDate && selectedCounselor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Time Slots <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {timeSlots.map((time) => {
                    const isBooked = isSlotBooked(time);
                    const isPast = isSlotPast(selectedDate, time);
                    const isDisabled = isBooked || isPast;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => !isDisabled && setSelectedTime(time)}
                        disabled={isDisabled}
                        className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isDisabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <Clock className="w-4 h-4 inline mr-2" />
                        {time}
                        {isBooked && <span className="block text-xs mt-1">Booked</span>}
                        {isPast && !isBooked && <span className="block text-xs mt-1">Past</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Each session is 60 minutes. Grayed out slots are unavailable.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topics you'd like to discuss..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

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

            <button
              type="submit"
              disabled={submitting || !selectedCounselor || !selectedDate || !selectedTime}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
    </div>
  );
};

export default SchedulePage;
