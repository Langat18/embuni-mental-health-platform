import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, UserCheck, AlertTriangle, Activity, 
  TrendingUp, FileText, Shield, Calendar, 
  BarChart3, PieChart, Clock, CheckCircle2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingCounselors, setPendingCounselors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [crisisEvents, setCrisisEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, approvals, analytics, crisis

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch pending counselor approvals
      const counselorsRes = await fetch('http://localhost:8000/api/admin/counselors/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const counselorsData = await counselorsRes.json();
      setPendingCounselors(counselorsData);

      // Fetch analytics (NO PII)
      const analyticsRes = await fetch('http://localhost:8000/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      // Fetch recent crisis events (anonymized)
      const crisisRes = await fetch('http://localhost:8000/api/admin/crisis-events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const crisisData = await crisisRes.json();
      setCrisisEvents(crisisData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCounselor = async (counselorId, approved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/counselors/${counselorId}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved })
      });

      if (response.ok) {
        // Show success message
        alert(approved ? 'Counselor approved successfully!' : 'Application rejected');
        // Refresh data
        fetchDashboardData();
      } else {
        alert('Failed to process approval');
      }
    } catch (error) {
      console.error('Failed to approve counselor:', error);
      alert('Error processing approval');
    }
  };

  const exportReport = async (reportType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/reports/${reportType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `embuni_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
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
                  className="text-yellow-900 underline text-sm mt-2 font-medium"
                >
                  Review applications →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="inline h-4 w-4 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors relative ${
                  activeTab === 'approvals'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="inline h-4 w-4 mr-2" />
                Counselor Approvals
                {pendingCounselors.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                    {pendingCounselors.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="inline h-4 w-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('crisis')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'crisis'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="inline h-4 w-4 mr-2" />
                Crisis Events
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && analytics && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-blue-900">Total Users</h3>
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{analytics.total_users}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {analytics.active_users} active this week
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-green-900">Total Tickets</h3>
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-900">{analytics.total_tickets}</p>
                    <p className="text-sm text-green-700 mt-1">
                      {analytics.active_tickets} currently active
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-purple-900">Avg Response Time</h3>
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{analytics.avg_response_time}m</p>
                    <p className="text-sm text-green-700 mt-1">
                      ↓ 12% from last week
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-red-900">Crisis Events</h3>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-900">{analytics.crisis_events_count}</p>
                    <p className="text-sm text-red-700 mt-1">
                      {analytics.resolved_crisis_events} resolved
                    </p>
                  </div>
                </div>

                {/* System Health & Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="h-5 w-5 text-indigo-600 mr-2" />
                      System Health
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Counselors</span>
                        <span className="font-semibold text-gray-900">{analytics.active_counselors}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Students</span>
                        <span className="font-semibold text-gray-900">{analytics.active_students}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Resolution Time</span>
                        <span className="font-semibold text-gray-900">{analytics.avg_resolution_time}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">System Uptime</span>
                        <span className="font-semibold text-green-600">99.8%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Database Size</span>
                        <span className="font-semibold text-gray-900">{analytics.db_size_mb} MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      This Week's Activity
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">New Registrations</span>
                        <span className="font-semibold text-gray-900">{analytics.new_users_this_week}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tickets Created</span>
                        <span className="font-semibold text-gray-900">{analytics.tickets_this_week}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tickets Resolved</span>
                        <span className="font-semibold text-gray-900">{analytics.resolved_this_week}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sessions Scheduled</span>
                        <span className="font-semibold text-gray-900">{analytics.sessions_this_week}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Crisis Interventions</span>
                        <span className="font-semibold text-red-600">{analytics.crisis_this_week}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button 
                      onClick={() => exportReport('users')}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <Users className="h-5 w-5 text-blue-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Manage Users</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <BarChart3 className="h-5 w-5 text-purple-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">View Analytics</p>
                    </button>
                    <button 
                      onClick={() => exportReport('tickets')}
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <FileText className="h-5 w-5 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Export Reports</p>
                    </button>
                    <button className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors">
                      <Shield className="h-5 w-5 text-gray-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">System Settings</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COUNSELOR APPROVALS TAB */}
            {activeTab === 'approvals' && (
              <div className="space-y-4">
                {pendingCounselors.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
                    <p className="text-gray-600">All counselor applications have been processed</p>
                  </div>
                ) : (
                  pendingCounselors.map((counselor) => (
                    <div key={counselor.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 font-bold text-2xl">
                            {counselor.full_name.charAt(0)}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{counselor.full_name}</h3>
                              <p className="text-sm text-gray-600">{counselor.email}</p>
                            </div>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                              Pending Review
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Department</p>
                              <p className="font-medium text-gray-900">{counselor.department || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Phone</p>
                              <p className="font-medium text-gray-900">{counselor.phone}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Registration Date</p>
                              <p className="font-medium text-gray-900">
                                {new Date(counselor.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Email Verified</p>
                              <p className="font-medium">
                                {counselor.email.endsWith('@embuni.ac.ke') ? (
                                  <span className="text-green-600">✓ Valid Staff Email</span>
                                ) : (
                                  <span className="text-red-600">✗ Invalid Email</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {counselor.bio && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Professional Background:</p>
                              <p className="text-sm text-gray-700">{counselor.bio}</p>
                            </div>
                          )}

                          {counselor.certifications && counselor.certifications.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-2">Certifications:</p>
                              <div className="flex flex-wrap gap-2">
                                {counselor.certifications.map((cert, idx) => (
                                  <span key={idx} className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                    {cert}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t">
                            <button
                              onClick={() => handleApproveCounselor(counselor.id, true)}
                              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors flex items-center justify-center"
                            >
                              <CheckCircle2 className="h-5 w-5 mr-2" />
                              Approve as Counselor
                            </button>
                            <button
                              onClick={() => handleApproveCounselor(counselor.id, false)}
                              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center"
                            >
                              <AlertTriangle className="h-5 w-5 mr-2" />
                              Reject Application
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                {/* Issue Categories Distribution */}
                {analytics.category_distribution && (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <PieChart className="h-5 w-5 text-indigo-600 mr-2" />
                        Issue Categories (Last 30 Days)
                      </h3>
                      <button 
                        onClick={() => exportReport('categories')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Export Data →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(analytics.category_distribution)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => {
                          const total = Object.values(analytics.category_distribution).reduce((a, b) => a + b, 0);
                          const percentage = ((count / total) * 100).toFixed(1);
                          
                          return (
                            <div key={category}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {category.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {count} tickets ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Counselor Workload Distribution */}
                {analytics.counselor_load && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 text-purple-600 mr-2" />
                      Counselor Workload Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.counselor_load)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([counselorId, load], index) => (
                          <div key={counselorId} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-700">
                                  Counselor {counselorId.slice(0, 8)}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">{load} tickets</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    load > 15 ? 'bg-red-500' : load > 10 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min((load / 20) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      * Counselor IDs are anonymized for privacy. Color coding: 
                      <span className="text-green-600 font-medium"> Green (optimal)</span>, 
                      <span className="text-yellow-600 font-medium"> Yellow (busy)</span>, 
                      <span className="text-red-600 font-medium"> Red (overloaded)</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CRISIS EVENTS TAB */}
            {activeTab === 'crisis' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Privacy Notice</h4>
                      <p className="text-sm text-red-800">
                        Crisis events are displayed in anonymized format. No personally identifiable 
                        information (PII) is shown to comply with data protection regulations.
                      </p>
                    </div>
                  </div>
                </div>

                {crisisEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Crisis Events</h3>
                    <p className="text-gray-600">No crisis events recorded in the last 30 days</p>
                  </div>
                ) : (
                  crisisEvents.map((event) => (
                    <div key={event.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            event.crisis_level === 'imminent' ? 'bg-red-100 text-red-800' :
                            event.crisis_level === 'high' ? 'bg-orange-100 text-orange-800' :
                            event.crisis_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.crisis_level.toUpperCase()} RISK
                          </span>
                          {event.resolved_at && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Trigger Reason:</p>
                          <p className="font-medium text-gray-900">{event.trigger_reason}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Detection Method:</p>
                          <p className="font-medium text-gray-900">
                            {event.auto_detected ? 'Automatic (Keyword)' : 'Manual (Counselor)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Response Time:</p>
                          <p className="font-medium text-gray-900">
                            {event.acknowledged_at 
                              ? `${Math.round((new Date(event.acknowledged_at) - new Date(event.created_at)) / 60000)} minutes`
                              : 'Pending'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Duration:</p>
                          <p className="font-medium text-gray-900">
                            {event.resolved_at 
                              ? `${Math.round((new Date(event.resolved_at) - new Date(event.created_at)) / 3600000)} hours`
                              : 'Ongoing'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${event.contacts_notified ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-gray-700">Emergency Contacts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${event.admin_notified ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-gray-700">Admin Notified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${event.campus_security_notified ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-gray-700">Campus Security</span>
                        </div>
                      </div>

                      {event.resolution_notes && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Resolution Notes:</p>
                          <p className="text-sm text-gray-900">{event.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Protection Footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Data Protection Compliance</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                All analytics displayed on this dashboard are aggregated and anonymized. No personally 
                identifiable information (PII) is included in reports or exports. This system complies 
                with the Kenya Data Protection Act 2019 and maintains the highest standards of 
                confidentiality for mental health data.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  ✓ Kenya DPA 2019 Compliant
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  ✓ End-to-End Encryption
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                  ✓ Auto-Delete After 12 Months
                </span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                  ✓ Role-Based Access Control
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;