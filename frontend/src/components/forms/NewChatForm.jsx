import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle } from 'lucide-react';

const NewChatForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    initialMessage: '',
    crisisLevel: 'none'
  });

  const categories = [
    'Academic Stress',
    'Anxiety & Depression',
    'Relationship Issues',
    'Family Problems',
    'Substance Abuse',
    'Self-Esteem',
    'Career Concerns',
    'Grief & Loss',
    'Trauma',
    'Other'
  ];

  const crisisLevels = [
    { value: 'none', label: 'Normal', color: 'text-gray-600' },
    { value: 'low', label: 'Low Priority', color: 'text-blue-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical/Emergency', color: 'text-red-600' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.initialMessage.trim()) {
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
          category: formData.category,
          initial_message: formData.initialMessage,
          crisis_level: formData.crisisLevel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const ticket = await response.json();
      navigate(`/student/chat/${ticket.id}`);

    } catch (err) {
      setError(err.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Start a Conversation</h1>
              <p className="text-gray-600">Connect with a counselor confidentially</p>
            </div>
          </div>

          {formData.crisisLevel === 'critical' && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Emergency Support</p>
                  <p className="text-sm text-red-800 mt-1">
                    If you're in immediate danger, please call:
                  </p>
                  <ul className="text-sm text-red-800 mt-2 space-y-1">
                    <li>• Kenya Red Cross: 1199</li>
                    <li>• Befrienders Kenya: 0722 178 177</li>
                    <li>• Campus Security: [NUMBER]</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to talk about? <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                {crisisLevels.map(level => (
                  <label key={level.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="crisisLevel"
                      value={level.value}
                      checked={formData.crisisLevel === level.value}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className={`ml-3 font-medium ${level.color}`}>
                      {level.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us what's on your mind <span className="text-red-500">*</span>
              </label>
              <textarea
                name="initialMessage"
                value={formData.initialMessage}
                onChange={handleChange}
                rows={6}
                placeholder="Share what you're going through... Remember, this is a safe and confidential space."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Your conversation will be confidential and handled by a trained counselor.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>What happens next:</strong>
              </p>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>You'll receive a unique ticket number</li>
                <li>An available counselor will accept your request</li>
                <li>You can start chatting immediately</li>
                <li>All conversations are encrypted and private</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </div>
                ) : (
                  'Start Conversation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewChatForm;