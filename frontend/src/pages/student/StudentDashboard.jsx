import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Calendar, AlertTriangle, User, 
  Shield, Phone, FileText, Activity, Heart 
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [recentAssessment, setRecentAssessment] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const ticketsRes = await fetch('http://localhost:8000/api/tickets/my-tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTickets(await ticketsRes.json());

      const contactsRes = await fetch('http://localhost:8000/api/emergency-contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEmergencyContacts(await contactsRes.json());

      const assessmentRes = await fetch('http://localhost:8000/api/assessments/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRecentAssessment(await assessmentRes.json());

      const sessionsRes = await fetch('http://localhost:8000/api/schedules/upcoming', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUpcomingSessions(await sessionsRes.json());

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      follow_up: 'bg-purple-100 text-purple-800',
      resolved: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      minimal: 'text-green-600',
      mild: 'text-yellow-600',
      moderate: 'text-orange-600',
      moderately_severe: 'text-red-600',
      severe: 'text-red-800'
    };
    return colors[severity] || 'text-gray-600';
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name}</h1>
          <p className="text-blue-100">Your mental wellbeing matters. We're here to support you.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to="/student/new-chat" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Start Chat</h3>
            <p className="text-sm text-gray-600 mt-1">Connect with a counsellor</p>
          </Link>

          <Link to="/student/assessment" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <FileText className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Self-Assessment</h3>
            <p className="text-sm text-gray-600 mt-1">Check your wellbeing</p>
          </Link>

          <Link to="/student/schedule" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <Calendar className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Schedule Session</h3>
            <p className="text-sm text-gray-600 mt-1">Book an appointment</p>
          </Link>

          <Link to="/student/resources" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <Heart className="h-8 w-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Resources</h3>
            <p className="text-sm text-gray-600 mt-1">Self-help materials</p>
          </Link>
        </div>

        {/* Assessment Alert */}
        {recentAssessment && recentAssessment.severity_level !== 'minimal' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Assessment Follow-up Recommended</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Your recent {recentAssessment.assessment_type.toUpperCase()} assessment indicated{' '}
                  <span className={`font-semibold ${getSeverityColor(recentAssessment.severity_level)}`}>
                    {recentAssessment.severity_level.replace('_', ' ')}
                  </span>{' '}
                  symptoms. We recommend connecting with a counsellor.
                </p>
                <Link to="/student/new-chat" className="text-yellow-900 underline text-sm mt-2 inline-block">
                  Start a conversation now →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tickets */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Conversations</h2>
                <Link to="/student/tickets" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">You haven't started any conversations yet</p>
                  <Link to="/student/new-chat" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Start Your First Chat
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.slice(0, 3).map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/student/chat/${ticket.id}`}
                      className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">Ticket #{ticket.ticket_number}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            {ticket.crisis_level !== 'none' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                {ticket.crisis_level}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Category: {ticket.category}</p>
                          {ticket.counsellor && (
                            <p className="text-sm text-gray-500">
                              With: {ticket.counsellor.full_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sessions */}
            {upcomingSessions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-start p-4 border rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {new Date(session.scheduled_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.duration_minutes} minutes • {session.meeting_type}
                        </p>
                        {session.meeting_link && (
                          <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block">
                            Join Meeting →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Emergency Contacts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  Emergency Contacts
                </h2>
                <Link to="/student/emergency-contacts" className="text-blue-600 hover:text-blue-700 text-sm">
                  Edit
                </Link>
              </div>

              {emergencyContacts.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
                  <p className="text-sm text-red-800 font-medium mb-2">No emergency contacts added</p>
                  <Link to="/student/emergency-contacts" className="text-red-900 underline text-sm">
                    Add contacts now →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {emergencyContacts.slice(0, 2).map((contact) => (
                    <div key={contact.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">{contact.contact_name}</p>
                        {contact.is_primary && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {contact.phone_number}
                      </div>
                    </div>
                  ))}
                  {emergencyContacts.length > 2 && (
                    <Link to="/student/emergency-contacts" className="text-blue-600 hover:text-blue-700 text-sm block text-center">
                      View all {emergencyContacts.length} contacts →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Crisis Info */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 mb-2">In Crisis?</h3>
                  <p className="text-sm text-red-800 mb-3">
                    If you're in immediate danger or having thoughts of self-harm, please:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-red-900">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Kenya Red Cross: 1199</span>
                    </div>
                    <div className="flex items-center text-red-900">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Befrienders Kenya: 0722 178 177</span>
                    </div>
                    <div className="flex items-center text-red-900">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Campus Security: [NUMBER]</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wellbeing Tip */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
              <Activity className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Daily Wellbeing Tip</h3>
              <p className="text-sm text-gray-700">
                "Take 5 minutes today for deep breathing. Inhale for 4 counts, hold for 4, exhale for 4. 
                Repeat 5 times."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
