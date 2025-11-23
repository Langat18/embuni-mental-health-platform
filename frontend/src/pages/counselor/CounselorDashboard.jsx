// Counselor Dashboard – manages tickets, crisis alerts, and daily schedule

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Calendar, AlertTriangle, Users, 
  Clock, CheckCircle, FileText, Bell, Activity 
} from 'lucide-react';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [crisisAlerts, setCrisisAlerts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    resolved: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Poll for crisis alerts every 30 seconds
    const interval = setInterval(() => {
      fetchCrisisAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const ticketsRes = await fetch('http://localhost:8000/api/counselor/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTickets(await ticketsRes.json());

      await fetchCrisisAlerts();

      const scheduleRes = await fetch('http://localhost:8000/api/counselor/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSchedule(await scheduleRes.json());

      const statsRes = await fetch('http://localhost:8000/api/counselor/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await statsRes.json());

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCrisisAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/counselor/crisis-alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCrisisAlerts(await response.json());
    } catch (error) {
      console.error('Failed to fetch crisis alerts:', error);
    }
  };

  const handleAcceptTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/counselor/tickets/${ticketId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to accept ticket:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      normal: 'bg-blue-100 text-blue-800 border-blue-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[priority] || colors.normal;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Counselor Dashboard</h1>
          <p className="text-green-100">Welcome back, {user?.full_name}</p>
        </div>

        {/* Crisis Alerts */}
        {crisisAlerts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-start">
              <Bell className="h-6 w-6 text-red-600 mr-3 animate-bounce" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-2">
                  🚨 {crisisAlerts.length} ACTIVE CRISIS ALERT{crisisAlerts.length > 1 ? 'S' : ''}
                </h3>

                <div className="space-y-2">
                  {crisisAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      to={`/counselor/crisis/${alert.id}`}
                      className="block p-3 bg-white border-2 border-red-300 rounded-lg hover:bg-red-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-900">
                            {alert.student_name} - Ticket #{alert.ticket_number}
                          </p>
                          <p className="text-sm text-red-800">
                            Level: <span className="font-bold">{alert.crisis_level.toUpperCase()}</span>
                            {' • '}
                            {new Date(alert.created_at).toLocaleTimeString()}
                          </p>
                        </div>

                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          RESPOND NOW
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Cases</p>
              <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <MessageSquare className="h-10 w-10 text-blue-200" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-200" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved Today</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-200" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className="text-3xl font-bold text-purple-600">{stats.avgResponseTime}m</p>
            </div>
            <Activity className="h-10 w-10 text-purple-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ticket Queue */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Ticket Queue</h2>
              </div>

              <div className="divide-y">
                
                {/* New Tickets */}
                <div className="p-4 bg-yellow-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    New Requests ({tickets.filter(t => t.status === 'new').length})
                  </h3>

                  <div className="space-y-2">
                    {tickets.filter(t => t.status === 'new').map((ticket) => (
                      <div key={ticket.id} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">#{ticket.ticket_number}</span>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>

                              {ticket.assessment_severity && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                  {ticket.assessment_severity} symptoms
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Category:</strong> {ticket.category}
                            </p>

                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.reason_for_seeking}</p>

                            <p className="text-xs text-gray-500 mt-2">
                              Submitted {new Date(ticket.created_at).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handleAcceptTicket(ticket.id)}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Conversations */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                    Active Conversations ({tickets.filter(t => t.status === 'active').length})
                  </h3>

                  <div className="space-y-2">
                    {tickets.filter(t => t.status === 'active').map((ticket) => (
                      <Link
                        key={ticket.id}
                        to={`/counselor/chat/${ticket.id}`}
                        className="block p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {ticket.student.full_name} • #{ticket.ticket_number}
                            </p>
                            <p className="text-sm text-gray-600">{ticket.category}</p>

                            {ticket.unread_messages > 0 && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full mt-1 inline-block">
                                {ticket.unread_messages} new messages
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-500">
                            {new Date(ticket.updated_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Schedule */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                Today’s Schedule
              </h2>

              {schedule.length === 0 ? (
                <p className="text-gray-500 text-sm">No sessions scheduled today</p>
              ) : (
                <div className="space-y-3">
                  {schedule.map((session) => (
                    <div key={session.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {session.duration_minutes}min
                        </span>
                      </div>

                      <p className="text-sm text-gray-700">{session.student.full_name}</p>
                      <p className="text-xs text-gray-600">{session.meeting_type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-2">
                <Link to="/counselor/availability" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center">
                  Set Availability
                </Link>
                <Link to="/counselor/notes" className="block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center">
                  View All Notes
                </Link>
                <Link to="/counselor/resources" className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center">
                  Resources Library
                </Link>
              </div>
            </div>

            {/* Crisis Protocol */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
              <h3 className="font-semibold text-red-900 mb-2">Crisis Protocol</h3>

              <p className="text-sm text-red-800 mb-3">If a student is at immediate risk:</p>

              <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                <li>Stay engaged in conversation</li>
                <li>Click "Trigger Crisis Protocol"</li>
                <li>Emergency contacts notified automatically</li>
                <li>Campus security alerted</li>
              </ol>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default CounselorDashboard;
