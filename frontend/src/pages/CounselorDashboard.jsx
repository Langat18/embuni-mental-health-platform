import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, Calendar, Users, Activity, 
  Clock, AlertTriangle, CheckCircle, LogOut, Menu, X, User, Video, MapPin 
} from 'lucide-react';

const CounselorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [tickets, setTickets] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const myTicketsRes = await fetch('http://localhost:8000/api/tickets/my-tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (myTicketsRes.ok) {
        const data = await myTicketsRes.json();
        setTickets(data);
      }

      const availableRes = await fetch('http://localhost:8000/api/tickets/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableTickets(data);
      }

      const sessionsRes = await fetch('http://localhost:8000/api/schedules/upcoming', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setUpcomingSessions(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/tickets/${ticketId}/assign-to-me`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      follow_up: 'bg-purple-100 text-purple-800',
      resolved: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCrisisColor = (level) => {
    const colors = {
      none: 'text-gray-600',
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[level] || 'text-gray-600';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Counselor Panel</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/counselor/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-gray-500 text-xs">Counselor</p>
                  </div>
                </div>
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
              <Link to="/counselor/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                Dashboard
              </Link>
              <div className="px-3 py-2 border-t">
                <p className="text-sm text-gray-600 mb-2">{user?.full_name}</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name}</h1>
          <p className="text-blue-100">Manage your counseling sessions and support students</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">My Active Chats</p>
                <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Unassigned</p>
                <p className="text-3xl font-bold text-gray-900">{availableTickets.filter(t => !t.counselor_id).length}</p>
              </div>
              <Users className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Upcoming Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{upcomingSessions.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Urgent Cases</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tickets.filter(t => ['high', 'critical'].includes(t.crisis_level)).length}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-b">
          <div className="flex gap-8 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-2 font-medium transition border-b-2 whitespace-nowrap ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Active Chats ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-2 font-medium transition border-b-2 whitespace-nowrap ${
                activeTab === 'available'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Available Chats ({availableTickets.filter(t => !t.counselor_id).length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-2 font-medium transition border-b-2 whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Schedule ({upcomingSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-2 font-medium transition border-b-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Assigned ({availableTickets.length})
            </button>
          </div>
        </div>

        {activeTab === 'active' && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No active chats</p>
                <p className="text-gray-400">Check the "Available Chats" tab to pick up new conversations</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/counselor/chat/${ticket.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {ticket.student?.full_name || 'Anonymous Student'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        {ticket.crisis_level !== 'none' && (
                          <span className={`text-xs px-2 py-1 rounded-full bg-red-100 ${getCrisisColor(ticket.crisis_level)}`}>
                            {ticket.crisis_level} priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Category:</strong> {ticket.category}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Ticket:</strong> #{ticket.ticket_number}
                      </p>
                      {ticket.initial_message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {ticket.initial_message.length > 150 
                            ? `${ticket.initial_message.substring(0, 150)}...` 
                            : ticket.initial_message}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableTickets.filter(t => !t.counselor_id).length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">All caught up!</p>
                <p className="text-gray-400">No unassigned chats at the moment</p>
              </div>
            ) : (
              availableTickets.filter(t => !t.counselor_id).map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {ticket.student?.full_name || 'Anonymous Student'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                          Unassigned
                        </span>
                        {ticket.crisis_level !== 'none' && (
                          <span className={`text-xs px-2 py-1 rounded-full bg-red-100 ${getCrisisColor(ticket.crisis_level)}`}>
                            {ticket.crisis_level} priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Category:</strong> {ticket.category}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Ticket:</strong> #{ticket.ticket_number}
                      </p>
                      {ticket.initial_message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-3">
                          {ticket.initial_message}
                        </p>
                      )}
                      <button
                        onClick={() => handleAssignTicket(ticket.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Take This Chat
                      </button>
                    </div>
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Upcoming Sessions</h2>
              <button
                onClick={fetchData}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
            
            {upcomingSessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No upcoming sessions</p>
                <p className="text-gray-400">Students can schedule sessions with you</p>
              </div>
            ) : (
              upcomingSessions.map((session) => {
                const dateTime = formatDateTime(session.scheduled_at);
                return (
                  <div key={session.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="h-6 w-6 text-purple-600" />
                          <div>
                            <p className="font-bold text-lg text-gray-900">{dateTime.date}</p>
                            <p className="text-gray-600">{dateTime.time}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <p className="text-sm text-gray-700">
                              <strong>Student:</strong> {session.student?.full_name || 'Unknown'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <p className="text-sm text-gray-700">
                              <strong>Duration:</strong> {session.duration_minutes} minutes
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {session.meeting_type === 'virtual' ? (
                              <>
                                <Video className="h-4 w-4 text-gray-500" />
                                <p className="text-sm text-gray-700">
                                  <strong>Type:</strong> Virtual Meeting
                                </p>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <p className="text-sm text-gray-700">
                                  <strong>Type:</strong> In-Person
                                </p>
                              </>
                            )}
                          </div>
                          
                          {session.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-900">
                                <strong>Notes:</strong> {session.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-4">
            {availableTickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No tickets yet</p>
              </div>
            ) : (
              availableTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {ticket.student?.full_name || 'Anonymous Student'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        {ticket.crisis_level !== 'none' && (
                          <span className={`text-xs font-medium ${getCrisisColor(ticket.crisis_level)}`}>
                            {ticket.crisis_level}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Category: {ticket.category} • 
                        {ticket.counselor ? ` Counselor: ${ticket.counselor.full_name}` : ' Unassigned'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorDashboard;
