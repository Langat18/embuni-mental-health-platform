import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, AlertTriangle, Activity, 
  TrendingUp, FileText, Shield, Calendar, 
  BarChart3, PieChart, Clock, CheckCircle2,
  X, User, Mail, Phone, Award, Check
} from 'lucide-react';
import CounselorRegistrationModal from '../components/common/CounselorRegistrationModal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [pendingCounselors, setPendingCounselors] = useState([]);
  const [crisisEvents, setCrisisEvents] = useState([]);

  useEffect(() => {
    // Fetch initial data for the dashboard
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAnalytics(data.analytics);
      setPendingCounselors(data.pending_counselors);
      setCrisisEvents(data.crisis_events);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleApproveCounselor = async (counselorId, approve) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/admin/counselors/${counselorId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
      const response = await fetch(`http://localhost:8000/api/admin/reports/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <>
    <CounselorRegistrationModal 
      isOpen={showRegistrationModal}
      onClose={() => setShowRegistrationModal(false)}
      onSuccess={(newCounselor) => {
        console.log('New counselor registered:', newCounselor);
        fetchDashboardData();
      }}
    />
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-indigo-100">System Overview & Management</p>
        </div>

        {/* Pending Counselor Approvals Alert */}
        {pendingCounselors.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  {pendingCounselors.length} Counselor{pendingCounselors.length > 1 ? 's' : ''} Awaiting Approval
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Review and approve counselor registrations to grant system access
                </p>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="text-yellow-900 font-medium underline hover:text-yellow-700 mt-2"
                >
                  Review Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Register Counselor
          </button>
          <button
            onClick={() => exportReport('comprehensive')}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border-b">
          <div className="flex gap-8 px-6">
            {['overview', 'approvals', 'crisis', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium transition border-b-2 ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.total_users}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Counselors</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.active_counselors}</p>
                  </div>
                  <UserCheck className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.active_tickets}</p>
                  </div>
                  <Activity className="w-10 h-10 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Crisis Events</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.crisis_events_count}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">This Week</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Users</span>
                    <span className="font-bold text-indigo-600">{analytics?.new_users_this_week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Tickets</span>
                    <span className="font-bold text-indigo-600">{analytics?.tickets_this_week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved</span>
                    <span className="font-bold text-green-600">{analytics?.resolved_this_week}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Response Time</span>
                    <span className="font-bold">{analytics?.avg_response_time}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Resolution Time</span>
                    <span className="font-bold">{analytics?.avg_resolution_time}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions This Week</span>
                    <span className="font-bold text-blue-600">{analytics?.sessions_this_week}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">System Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Students</span>
                    <span className="font-bold">{analytics?.active_students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database Size</span>
                    <span className="font-bold">{analytics?.db_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crisis Resolution</span>
                    <span className="font-bold text-green-600">{analytics?.resolved_crisis_events}/{analytics?.crisis_events_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPROVALS TAB */}
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
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {counselor.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {counselor.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            {counselor.department}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Applied: {new Date(counselor.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-4"><strong>Bio:</strong> {counselor.bio}</p>
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Certifications:</p>
                          <div className="space-y-1">
                            {counselor.certifications?.map((cert, idx) => (
                              <div key={idx} className="text-sm text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                {cert}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveCounselor(counselor.id, true)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveCounselor(counselor.id, false)}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No pending counselor approvals
                </div>
              )}
            </div>
          </div>
        )}

        {/* CRISIS TAB */}
        {activeTab === 'crisis' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Crisis Events</h2>
            </div>
            <div className="divide-y">
              {crisisEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.crisis_level === 'imminent' ? 'bg-red-100 text-red-800' :
                          event.crisis_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.crisis_level.toUpperCase()}
                        </span>
                        {event.auto_detected && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Auto-Detected</span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">{event.trigger_reason}</p>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p>Detected: {new Date(event.created_at).toLocaleString()}</p>
                        {event.resolved_at && (
                          <p className="text-green-600">Resolved: {new Date(event.resolved_at).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="mt-3 space-y-1 text-sm">
                        <p>Contacts Notified: {event.contacts_notified ? '✓' : '✗'}</p>
                        <p>Campus Security: {event.campus_security_notified ? '✓' : '✗'}</p>
                      </div>
                      {event.resolution_notes && (
                        <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-green-500">
                          <strong>Resolution:</strong> {event.resolution_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">Ticket Categories</h3>
                <div className="space-y-3">
                  {analytics?.category_distribution && Object.entries(analytics.category_distribution).map(([category, count]) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{width: `${(count / 100) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">Counselor Workload</h3>
                <div className="space-y-3">
                  {analytics?.counselor_load && Object.entries(analytics.counselor_load).map(([counselor, tickets]) => (
                    <div key={counselor}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{counselor}</span>
                        <span className="font-semibold">{tickets} tickets</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{width: `${(tickets / 20) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;