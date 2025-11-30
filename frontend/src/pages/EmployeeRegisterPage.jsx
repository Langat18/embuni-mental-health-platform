// frontend/src/pages/EmployeeRegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, Users, Check } from 'lucide-react';
import { registerEmployee } from '../services/authService';

const EmployeeRegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1: Account
    username: '',
    staffId: '',
    email: '',
    password: '',
    
    // Step 2: Profile
    fullName: '',
    phoneNumber: '',
    gender: '',
    studentLevel: '',
    
    // Step 3: Next of Kin
    kinFullName: '',
    kinRelationship: '',
    kinEmail: '',
    kinPhoneNumber: '',
    
    consent: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.username || !formData.staffId || !formData.email || !formData.password) {
          setError('Please fill all required fields');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters with at least one number');
          return false;
        }
        break;
      case 2:
        if (!formData.fullName || !formData.phoneNumber || !formData.gender || !formData.studentLevel) {
          setError('Please fill all required fields');
          return false;
        }
        break;
      case 3:
        if (!formData.kinFullName || !formData.kinRelationship || !formData.kinPhoneNumber) {
          setError('Please fill all required fields');
          return false;
        }
        if (!formData.consent) {
          setError('You must provide consent to proceed');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setLoading(true);

    try {
      await registerEmployee({
        username: formData.username,
        staff_id: formData.staffId,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        gender: formData.gender,
        student_level: formData.studentLevel,
        kin_full_name: formData.kinFullName,
        kin_relationship: formData.kinRelationship,
        kin_email: formData.kinEmail,
        kin_phone_number: formData.kinPhoneNumber
      });

      alert('Registration successful! Your account will be activated by the administrator.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/register')}
          className="text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-2 transition"
        >
          ← Back to Role Selection
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create your account</h2>
        <p className="text-center text-gray-600 mb-2">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-green-600 hover:underline">
            Sign in
          </button>
        </p>
        <p className="text-center text-sm italic text-gray-500 mb-8">Knowledge transforms</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              currentStep >= 1 ? 'bg-green-600' : 'bg-gray-200'
            }`}>
              {currentStep > 1 ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <User className={`w-6 h-6 ${currentStep >= 1 ? 'text-white' : 'text-gray-400'}`} />
              )}
            </div>
            <p className={`text-xs mt-2 font-medium ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              Account
            </p>
            <p className="text-xs text-gray-400">Basic account information</p>
          </div>

          {/* Connector Line */}
          <div className={`h-1 flex-1 mx-2 ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'
            }`}>
              {currentStep > 2 ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <BookOpen className={`w-6 h-6 ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`} />
              )}
            </div>
            <p className={`text-xs mt-2 font-medium ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              Profile
            </p>
            <p className="text-xs text-gray-400">Personal details</p>
          </div>

          {/* Connector Line */}
          <div className={`h-1 flex-1 mx-2 ${currentStep >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              currentStep >= 3 ? 'bg-green-600' : 'bg-gray-200'
            }`}>
              <Users className={`w-6 h-6 ${currentStep >= 3 ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <p className={`text-xs mt-2 font-medium ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              Next of Kin
            </p>
            <p className="text-xs text-gray-400">Emergency contact</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Account Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username (firstname_lastname) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="john_kamau"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                  placeholder="X1234"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.kamau@uoem.ac.ke"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (6 characters with at least one number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Next
              </button>
            </div>
          )}

          {/* STEP 2: Profile Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Kamau"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+254 712 345 678"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="studentLevel"
                  value={formData.studentLevel}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select student level</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Next of Kin Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next of Kin Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="kinFullName"
                  value={formData.kinFullName}
                  onChange={handleChange}
                  placeholder="Jane Kamau"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  name="kinRelationship"
                  value={formData.kinRelationship}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  name="kinEmail"
                  value={formData.kinEmail}
                  onChange={handleChange}
                  placeholder="jane.kamau@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="kinPhoneNumber"
                  value={formData.kinPhoneNumber}
                  onChange={handleChange}
                  placeholder="+254 712 345 678"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Consent */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    required
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to the collection and processing of my personal data for employment and administrative purposes. 
                    All data will be handled according to the Data Protection Act and university policies.
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Back to Role Selection */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegisterPage;