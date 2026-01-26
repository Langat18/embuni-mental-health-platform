import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Shield, Calendar } from 'lucide-react';
import axios from 'axios';

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    satisfactionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'url(/assets/images/image12.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="min-h-screen bg-black/40">
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/images/embunilogo.png" 
                alt="University of Embu Logo" 
                className="w-14 h-14 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Embuni Counseling</h1>
                <p className="text-xs text-gray-500">University of Embu</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        </nav>

        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              University of Embu Mental Health & Counseling Center
            </h1>
            <p className="text-xl text-white mb-8 drop-shadow-lg">
              Supporting mental health and wellbeing through professional counseling services.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-yellow-500 text-white text-lg font-semibold rounded-lg hover:bg-yellow-600 transition shadow-lg"
            >
              Get Started
            </button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md text-center hover:shadow-lg transition">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Counselors</h3>
              <p className="text-gray-600">Access to qualified and experienced counseling professionals</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md text-center hover:shadow-lg transition">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Scheduling</h3>
              <p className="text-gray-600">Book appointments at your convenience</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md text-center hover:shadow-lg transition">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Platform</h3>
              <p className="text-gray-600">Confidential and secure counseling sessions</p>
            </div>
          </div>
        </section>

        <section className="bg-black/40 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-4 drop-shadow-lg">
              Empowering Mental Well-being
            </h2>
            <p className="text-center text-white mb-12 drop-shadow-lg">
              Discover how our counseling services have made a difference in our community.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md">
                {loading ? (
                  <div className="text-5xl font-bold text-blue-600 mb-2 animate-pulse">...</div>
                ) : (
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {stats.totalSessions}+
                  </div>
                )}
                <div className="text-gray-700 font-medium">Sessions Conducted</div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md">
                {loading ? (
                  <div className="text-5xl font-bold text-green-600 mb-2 animate-pulse">...</div>
                ) : (
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {stats.totalStudents}+
                  </div>
                )}
                <div className="text-gray-700 font-medium">Students Served</div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-md">
                {loading ? (
                  <div className="text-5xl font-bold text-purple-600 mb-2 animate-pulse">...</div>
                ) : (
                  <div className="text-5xl font-bold text-purple-600 mb-2">
                    {stats.satisfactionRate}%
                  </div>
                )}
                <div className="text-gray-700 font-medium">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Your Mental Health Matters</h2>
            <p className="text-xl text-white mb-8">
              Reach out to us for support and take the first step towards a healthier mind.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-gray-50 transition shadow-lg"
            >
              Contact Us
            </button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Join Our Community</h2>
            <p className="text-white drop-shadow-lg">
              Explore resources, workshops, and support groups tailored to your needs.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Ready to Get Started?</h3>
            <p className="text-lg mb-8 text-gray-700">
              Sign up for a session or contact our team for personalized support.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Book a Session
            </button>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="mb-2">© 2026 University of Embu • Counseling Center</p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition">Contact Support</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition">Emergency: +25417456116</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;