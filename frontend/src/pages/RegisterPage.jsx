import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Heart, Users } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [registrationType, setRegistrationType] = useState(null);

  const handleStudentRegister = () => {
    navigate('/register/student');
  };

  const handleStaffRegister = () => {
    navigate('/register/staff');
  };

  if (registrationType === 'student') {
    return handleStudentRegister();
  }

  if (registrationType === 'staff') {
    return handleStaffRegister();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <span>← Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-6 shadow-lg">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to the Counseling Portal</h1>
          <p className="text-xl text-gray-600">Choose your registration type</p>
        </div>

        {/* Registration Options */}
        <div className="space-y-4">
          <button
            onClick={handleStudentRegister}
            className="w-full bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 text-left group border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Register as Student</h2>
                  <p className="text-gray-600 mt-1">Access counseling services and support</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition" />
            </div>
          </button>
          <button
            onClick={handleStaffRegister}
            className="w-full bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 text-left group border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Register as Staff</h2>
                  <p className="text-gray-600 mt-1">Access our services and support</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;