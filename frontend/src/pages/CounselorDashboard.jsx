import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Calendar, Users, AlertTriangle, 
  CheckCircle, Clock, Activity 
} from 'lucide-react';
import TicketCard from '../components/common/TicketCard';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    new: 0,
    followUp: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const myTicketsRes = await fetch('http://localhost:8000/api/tickets/my-tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const myTickets = await myTicketsRes.json();
      setTickets(myTickets);

      const availableRes = await fetch('http://localhost:8000/api/tickets/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const available = await availableRes.json();
      setAvailableTickets(available);

      const sessionsRes = await fetch('http://localhost:8000/api/schedules/upcoming', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sessions = await sessionsRes.json();
      setUpcomingSessions(sessions);

      setStats({
        active: myTickets.filter(t => t.status === 'active').length,
        new: available.filter(t => t.status === 'new').length,
        followUp: myTickets.filter(t => t.status === 'follow_up').length,
        resolved: myTickets.filter(t => t.status === 'resolved').length
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Counselor Dashboard</h1>
          <p className="text-green-100">Welcome back, {user?.full_name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Activity className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Requests</p>
                <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <MessageSquare className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Follow-ups</p>
                <p className="text-3xl font-bold text-purple-600">{stats.followUp}</p>
              </div>
              <Clock className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-gray-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-gray-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Available Tickets</h2>
              <span className="text-sm text-gray-500">{availableTickets.length} waiting</span>
            </div>

            {availableTickets.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No new tickets available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} userRole="counselor" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Active Cases</h2>
              <Link to="/counselor/tickets" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All →
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No assigned cases yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tickets.slice(0, 5).map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} userRole="counselor" />
                ))}
              </div>
            )}
          </div>
        </div>

        {upcomingSessions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {new Date(session.scheduled_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.duration_minutes} min • {session.meeting_type}
                      </p>
                      {session.meeting_link && (
                        <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block">
                          Join Meeting →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorDashboard;