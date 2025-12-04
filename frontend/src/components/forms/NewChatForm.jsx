import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertCircle, Users, Loader } from 'lucide-react';

const NewChatForm = () => {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [loadingCounselors, setLoadingCounselors] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    counselor_id: '',
    category: '',
    initial_message: '',
    crisis_level: 'none'
  });

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    setLoadingCounselors(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated. Please login again.');
        navigate('/login');
        return;
      }

      console.log('Fetching counselors...');
      const response = await fetch('http://localhost:8000/api/counselors/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error('Failed to load counselors');
      }

      const data = await response.json();
      console.log('Counselors loaded:', data);
      setCounselors(data);

      if (data.length === 0) {
        setError('No counselors are currently available. Please try again later or contact support.');
      }
    } catch (error) {
      console.error('Error fetching counselors:', error);
      setError('Failed to load counselors. Please check your connection and try again.');
    } finally {
      setLoadingCounselors(false);
    }
  };

  const categories = [
    'Academic Stress',
    'Anxiety',
    'Depression',
    'Relationship Issues',
    'Family Problems',
    'Substance Abuse',
    'Trauma',
    'Self-Esteem',
    'Career Guidance',
    'Other'
  ];

  const crisisLevels = [
    { value: 'none', label: 'Not Urgent', color: 'text-gray-700' },
    { value: 'low', label: 'Low Priority', color: 'text-green-700' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-700' },
    { value: 'high', label: 'High Priority', color: 'text-orange-700' },
    { value: 'critical', label: 'Critical/Emergency', color: 'text-red-700' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.counselor_id) {
      setError('Please select a counselor');
      return;
    }

    if (!formData.category || !formData.initial_message) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/tickets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          counselor_id: parseInt(formData.counselor_id),
          category: formData.category,
          initial_message: formData.initial_message,
          crisis_level: formData.crisis_level
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create chat');
      }

      const ticket = await response.json();
      navigate(`/student/chat/${ticket.id}`);
    } catch (err) {
      setError(err.message || 'Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Start New Conversation</h2>
            <p className="text-gray-600">Connect with a counselor for support</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              {counselors.length === 0 && !loadingCounselors && (
                <button
                  onClick={fetchCounselors}
                  className="text-sm text-red-700 underline hover:text-red-900 mt-2"
                >
                  Try reloading counselors
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Counselor <span className="text-red-500">*</span>
            </label>
            
            {loadingCounselors ? (
              <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading counselors...</span>
              </div>
            ) : counselors.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No counselors available</p>
                <button
                  type="button"
                  onClick={fetchCounselors}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reload
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <select
                    name="counselor_id"
                    value={formData.counselor_id}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Choose a counselor...</option>
                    {counselors.map((counselor) => (
                      <option key={counselor.id} value={counselor.id}>
                        {counselor.full_name} - {counselor.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                {formData.counselor_id && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                    {(() => {
                      const selected = counselors.find(c => c.id === parseInt(formData.counselor_id));
                      return selected ? (
                        <div>
                          <p className="font-medium text-blue-900">{selected.full_name}</p>
                          <p className="text-sm text-blue-700 mt-1">{selected.bio}</p>
                          <p className="text-sm text-blue-600 mt-2">
                            <strong>Specializations:</strong> {selected.specializations.join(', ')}
                          </p>
                          <p className="text-sm text-blue-600">
                            <strong>Experience:</strong> {selected.years_of_experience} years
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {crisisLevels.map((level) => (
                <label key={level.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="crisis_level"
                    value={level.value}
                    checked={formData.crisis_level === level.value}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={`font-medium ${level.color}`}>{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="initial_message"
              value={formData.initial_message}
              onChange={handleChange}
              placeholder="Describe what you'd like to talk about..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              This will be your first message to the counselor.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Confidentiality Notice</p>
                <p>Your conversation will be kept confidential unless there are safety concerns that require disclosure.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingCounselors || counselors.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Starting Chat...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                Start Conversation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewChatForm;
