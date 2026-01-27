import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Filter, Book, Video, FileText, Headphones, 
  ExternalLink, MessageSquare, Phone, LogOut, Menu, X,
  Brain, Heart, Moon, Activity, Users
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const StudentResourcesPage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categoryIcons = {
    brain: Brain,
    heart: Heart,
    moon: Moon,
    activity: Activity,
    users: Users
  };

  const typeIcons = {
    article: Book,
    video: Video,
    guide: FileText,
    audio: Headphones,
    exercise: Activity
  };

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, [selectedCategory, selectedType, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/resources/categories`,
        getAuthHeaders()
      );
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(
        `${API_BASE_URL}/api/resources/?${params.toString()}`,
        getAuthHeaders()
      );
      setResources(response.data.resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = async (resource) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/resources/${resource.id}/track-access`,
        {},
        getAuthHeaders()
      );
      
      if (resource.url) {
        window.open(resource.url, '_blank');
      }
    } catch (error) {
      console.error('Error tracking resource access:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getTypeColor = (type) => {
    const colors = {
      article: 'bg-blue-100 text-blue-700',
      video: 'bg-purple-100 text-purple-700',
      guide: 'bg-green-100 text-green-700',
      audio: 'bg-yellow-100 text-yellow-700',
      exercise: 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Embuni Mental Health</h1>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/student/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/student/tickets" className="text-gray-700 hover:text-indigo-600 transition-colors">
                My Chats
              </Link>
              <Link to="/student/resources" className="text-indigo-600 font-medium">
                Resources
              </Link>
              <button onClick={handleLogout} className="text-gray-700 hover:text-red-600 transition-colors flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/student/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">
                Dashboard
              </Link>
              <Link to="/student/tickets" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">
                My Chats
              </Link>
              <Link to="/student/resources" className="block px-3 py-2 text-indigo-600 bg-indigo-50 font-medium">
                Resources
              </Link>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50">
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Resources</h1>
          <p className="text-gray-600">Browse our collection of articles, videos, and guides to support your wellbeing</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const IconComponent = categoryIcons[cat.icon];
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Types
            </button>
            {['article', 'video', 'guide', 'audio', 'exercise'].map((type) => {
              const IconComponent = typeIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => {
              const TypeIcon = typeIcons[resource.type];
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
                  onClick={() => handleResourceClick(resource)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(resource.type)}`}>
                      {TypeIcon && <TypeIcon className="h-3 w-3" />}
                      {resource.type}
                    </span>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{resource.duration}</span>
                    <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                      View Resource →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}

        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Need Immediate Support?</h2>
            <p className="mb-6">Our counselors are here to help you</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/student/new-chat"
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                Start a Chat
              </Link>
              <a
                href="tel:+254712345678"
                className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Emergency Hotline
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResourcesPage;