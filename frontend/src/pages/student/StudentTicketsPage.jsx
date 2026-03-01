import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageSquare, LogOut, Menu, X, Plus, Search,
  AlertTriangle, Clock, User, Filter
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StudentTicketsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterAndSearchTickets();
  }, [tickets, searchTerm, filterStatus]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tickets/my-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchTickets = () => {
    let filtered = tickets;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.counselor?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTickets(filtered);
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
      none: 'bg-gray-100 text-gray-600',
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-600';
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
      <nav className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* FIX: university logo instead of Shield icon */}
            <div className="flex items-center gap-2">
              <img src="/assets/images/embunilogo.png" alt="University of Embu" className="h-12 w-12 object-contain" />
              <span className="text-2xl font-bold text-gray-900">Embuni Counseling</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/student/dashboard" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200">
                Dashboard
              </Link>
              <Link to="/student/tickets" className="text-blue-600 bg-blue-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition duration-200">
                My Chats
              </Link>
              <Link to="/student/resources" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200">
                Resources
              </Link>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l">
                <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition duration-200">
                  <LogOut className="h-4 w-4" />Logout
                </button>
              </div>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-200 transition duration-200">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/student/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/student/tickets" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50" onClick={() => setMobileMenuOpen(false)}>My Chats</Link>
              <Link to="/student/resources" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition" onClick={() => setMobileMenuOpen(false)}>Resources</Link>
              <div className="px-3 py-2 border-t">
                <p className="text-sm text-gray-600 mb-2">{user?.full_name}</p>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4" />Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="w-full p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Conversations</h1>
              <p className="text-gray-600 mt-1">View and manage all your counseling conversations</p>
            </div>
            <Link to="/student/new-chat" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
              <Plus className="h-5 w-5" />Start New Chat
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ticket number, category, or counselor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="active">Active</option>
                <option value="follow_up">Follow Up</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No tickets found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start your first conversation with a counselor to get support'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/student/new-chat" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-5 w-5" />Start Your First Chat
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} to={`/student/chat/${ticket.id}`} className="block bg-white rounded-lg shadow-sm border hover:border-blue-500 hover:shadow-md transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Ticket #{ticket.ticket_number}</h3>
                      <p className="text-sm text-gray-600">{ticket.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    {/* FIX: guard against null crisis_level */}
                    {ticket.crisis_level && ticket.crisis_level !== 'none' && (
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCrisisColor(ticket.crisis_level)}`}>
                        {ticket.crisis_level}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{ticket.counselor ? ticket.counselor.full_name : 'Awaiting assignment'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {ticket.priority > 0 && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Priority: {ticket.priority}</span>
                    </div>
                  )}
                </div>
                {ticket.initial_message && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.initial_message}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {filteredTickets.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredTickets.length} of {tickets.length} conversation{tickets.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTicketsPage;