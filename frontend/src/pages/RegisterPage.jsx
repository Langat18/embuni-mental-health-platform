// frontend/src/pages/RegisterPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-2 transition"
        >
          ← Back to Home
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to the Counseling Portal
          </h2>
          <p className="text-gray-600">Choose your registration type</p>
        </div>

        {/* Role Options */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/register/student')}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition">
                <User className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Register as Student</h3>
                <p className="text-sm text-gray-600">Access counseling services and support</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600 text-2xl">→</span>
          </button>

          <button
            onClick={() => navigate('/register/counselor')}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition">
                <Heart className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Register as Counselor/Staff</h3>
                <p className="text-sm text-gray-600">Provide counseling services to students</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-green-600 text-2xl">→</span>
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-8">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;