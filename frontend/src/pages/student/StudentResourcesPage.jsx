import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, LogOut, Menu, X, BookOpen, Video, FileText, 
  Headphones, Phone, Heart, Brain, Smile, Coffee, Moon, 
  Activity, Download, ExternalLink
} from 'lucide-react';

const StudentResourcesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const categories = [
    { id: 'all', name: 'All Resources', icon: BookOpen },
    { id: 'anxiety', name: 'Anxiety & Stress', icon: Brain },
    { id: 'depression', name: 'Depression', icon: Heart },
    { id: 'sleep', name: 'Sleep & Rest', icon: Moon },
    { id: 'wellness', name: 'General Wellness', icon: Activity },
    { id: 'relationships', name: 'Relationships', icon: Smile }
  ];

  const resources = [
    {
      id: 1,
      category: 'anxiety',
      type: 'article',
      title: 'Understanding and Managing Anxiety',
      description: 'Learn practical techniques to manage anxiety and stress in your daily life.',
      duration: '10 min read',
      icon: FileText
    },
    {
      id: 2,
      category: 'anxiety',
      type: 'exercise',
      title: 'Breathing Exercises for Calm',
      description: 'Step-by-step breathing techniques to reduce stress and promote relaxation.',
      duration: '5 min practice',
      icon: Activity
    },
    {
      id: 3,
      category: 'depression',
      type: 'video',
      title: 'Recognizing Signs of Depression',
      description: 'Understanding depression symptoms and when to seek help.',
      duration: '8 min watch',
      icon: Video
    },
    {
      id: 4,
      category: 'depression',
      type: 'article',
      title: 'Self-Care Strategies for Mental Health',
      description: 'Daily practices to support your mental wellbeing and build resilience.',
      duration: '12 min read',
      icon: FileText
    },
    {
      id: 5,
      category: 'sleep',
      type: 'guide',
      title: 'Better Sleep Hygiene Guide',
      description: 'Comprehensive guide to improving your sleep quality and establishing healthy sleep habits.',
      duration: '15 min read',
      icon: Moon
    },
    {
      id: 6,
      category: 'sleep',
      type: 'audio',
      title: 'Guided Sleep Meditation',
      description: 'Relaxing meditation to help you fall asleep naturally.',
      duration: '20 min listen',
      icon: Headphones
    },
    {
      id: 7,
      category: 'wellness',
      type: 'article',
      title: 'Building Healthy Habits',
      description: 'Evidence-based strategies for creating and maintaining positive habits.',
      duration: '8 min read',
      icon: FileText
    },
    {
      id: 8,
      category: 'wellness',
      type: 'exercise',
      title: 'Mindfulness for Beginners',
      description: 'Introduction to mindfulness practice and its benefits for mental health.',
      duration: '10 min practice',
      icon: Activity
    },
    {
      id: 9,
      category: 'relationships',
      type: 'article',
      title: 'Healthy Communication Skills',
      description: 'Learn effective communication techniques for better relationships.',
      duration: '12 min read',
      icon: FileText
    },
    {
      id: 10,
      category: 'relationships',
      type: 'guide',
      title: 'Setting Boundaries',
      description: 'Understanding and establishing healthy boundaries in relationships.',
      duration: '10 min read',
      icon: Heart
    }
  ];

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  const getTypeColor = (type) => {
    const colors = {
      article: 'bg-blue-100 text-blue-700',
      video: 'bg-purple-100 text-purple-700',
      audio: 'bg-green-100 text-green-700',
      guide: 'bg-orange-100 text-orange-700',
      exercise: 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Embuni Counseling</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/student/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition">
                Dashboard
              </Link>
              <Link to="/student/tickets" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition">
                My Chats
              </Link>
              <Link to="/student/resources" className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">
                Resources
              </Link>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l">
                <span className="text-sm text-gray-700">{user?.full_name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/student/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/student/tickets" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}>
                My Chats
              </Link>
              <Link to="/student/resources" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50" onClick={() => setMobileMenuOpen(false)}>
                Resources
              </Link>
              <div className="px-3 py-2 border-t">
                <p className="text-sm text-gray-600 mb-2">{user?.full_name}</p>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Resources</h1>
          <p className="text-gray-600">Self-help materials, guides, and tools to support your wellbeing journey</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <div className="flex items-start gap-4">
            <Phone className="h-8 w-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">Need Immediate Help?</h3>
              <p className="mb-3">If you're in crisis or need urgent support, please reach out:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold">Kenya Red Cross: 1199</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold">Befrienders Kenya: 0722 178 177</span>
                </div>
              </div>
              <Link
                to="/student/new-chat"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                Talk to a Counselor Now
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(resource.type)}`}>
                    {resource.type}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {resource.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-500">{resource.duration}</span>
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Access
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Coffee className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can't find what you're looking for?</h3>
              <p className="text-gray-700 mb-4">
                Our counselors can provide personalized resources and recommendations based on your specific needs.
              </p>
              <Link
                to="/student/new-chat"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Ask a Counselor
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResourcesPage;