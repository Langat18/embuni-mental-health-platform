import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserCheck, AlertTriangle, Activity, 
  TrendingUp, FileText, Calendar, 
  Clock, X, User, Mail, Phone, Award, LogOut, Menu
} from 'lucide-react';
import CounselorRegistrationModal from '../components/common/CounselorRegistrationModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [pendingCounselors, setPendingCounselors] = useState([]);
  const [crisisEvents, setCrisisEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalytics(data.analytics ?? null);
      setPendingCounselors(data.pending_counselors ?? []);
      setCrisisEvents(data.crisis_events ?? []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCounselor = async (counselorId, approve) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/admin/counselors/${counselorId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve })
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving counselor:', error);
    }
  };

  const exportReport = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCrisisBadge = (level) => {
    const map = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return map[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <CounselorRegistrationModal 
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={() => {
          setShowRegistrationModal(false);
          fetchDashboardData();
        }}
      />

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md border-b sticky top-0 z-50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">

              {/* FIX: university logo instead of Shield icon */}
              <div className="flex items-center gap-2">
                <img src="/assets/images/embunilogo.png" alt="University of Embu" className="h-12 w-12 object-contain" />
                <span className="text-2xl font-bold text-gray-900">Admin Panel</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200">
                  <User className="h-5 w-5 text-gray-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{user?.full_name}</p>
                    <p className="text-gray-500 text-xs">Administrator</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition duration-200">
                  <LogOut className="h-4 w-4" />Logout
                </button>
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-200 transition duration-200">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="px-3 py-2 bg-gray-50 rounded-lg mb-2">
                  <p className="font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-gray-500 text-sm">Administrator</p>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut className="h-4 w-4" />Logout
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="w-full p-6 space-y-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-indigo-100">System Overview & Management</p>
          </div>

          {pendingCounselors.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">
                    {pendingCounselors.length} Counselor{pendingCounselors.length > 1 ? 's' : ''} Awaiting Approval
                  </h3>
                  <p className="text-sm text-yellow-800 mt-1">Review and approve counselor registrations to grant system access</p>
                  <button onClick={() => setActiveTab('approvals')} className="text-yellow-900 font-medium underline hover:text-yellow-700 mt-2">
                    Review Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={() => setShowRegistrationModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2">
              <Users className="w-5 h-5" />Register Counselor
            </button>
            <button onClick={() => exportReport('comprehensive')} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2">
              <FileText className="w-5 h-5" />Export Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border-b">
            <div className="flex gap-8 px-6 overflow-x-auto">
              {['overview', 'approvals', 'crisis', 'analytics'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'approvals' && pendingCounselors.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingCounselors.length}</span>
                  )}
                  {/* FIX: show count badge on crisis tab when there are events */}
                  {tab === 'crisis' && crisisEvents.length > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">{crisisEvents.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-gray-500 text-sm">Total Users</p><p className="text-3xl font-bold text-gray-900">{analytics.total_users || 0}</p></div>
                      <Users className="w-10 h-10 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-gray-500 text-sm">Active Counselors</p><p className="text-3xl font-bold text-gray-900">{analytics.active_counselors || 0}</p></div>
                      <UserCheck className="w-10 h-10 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-gray-500 text-sm">Active Tickets</p><p className="text-3xl font-bold text-gray-900">{analytics.active_tickets || 0}</p></div>
                      <Activity className="w-10 h-10 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-gray-500 text-sm">Crisis Events</p><p className="text-3xl font-bold text-gray-900">{analytics.crisis_events_count || 0}</p></div>
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No analytics data available.</p>
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Pending Counselor Approvals</h2>
              </div>
              <div className="divide-y">
                {pendingCounselors.length > 0 ? (
                  pendingCounselors.map((counselor) => (
                    <div key={counselor.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{counselor.full_name}</h3>
                          <div className="space-y-2 mt-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{counselor.email}</div>
                            <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{counselor.phone}</div>
                            <div className="flex items-center gap-2"><Award className="w-4 h-4" />{counselor.department}</div>
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Applied: {new Date(counselor.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-4"><strong>Bio:</strong> {counselor.bio || '—'}</p>
                          <div className="flex gap-3">
                            <button onClick={() => handleApproveCounselor(counselor.id, true)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition">Approve</button>
                            <button onClick={() => handleApproveCounselor(counselor.id, false)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition">Reject</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">No pending counselor approvals</div>
                )}
              </div>
            </div>
          )}

          {/* FIX: crisis tab now renders actual crisisEvents data instead of hardcoded "No crisis events" */}
          {activeTab === 'crisis' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Crisis Events</h2>
                <button onClick={fetchDashboardData} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Refresh</button>
              </div>
              {crisisEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No crisis events recorded</p>
                </div>
              ) : (
                <div className="divide-y">
                  {crisisEvents.map((event) => (
                    <div key={event.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span className="font-semibold text-gray-900">{event.student?.full_name || 'Unknown Student'}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCrisisBadge(event.crisis_level)}`}>{event.crisis_level}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1"><strong>Category:</strong> {event.category}</p>
                          {event.counselor && <p className="text-sm text-gray-600 mb-1"><strong>Counselor:</strong> {event.counselor.full_name}</p>}
                          {event.initial_message && (
                            <p className="text-sm text-gray-700 bg-red-50 p-3 rounded mt-2 line-clamp-2">{event.initial_message}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 ml-4 flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-4 w-4" />
                          {new Date(event.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">System Analytics</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                Analytics features coming soon
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;