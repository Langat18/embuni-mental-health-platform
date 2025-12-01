import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Calendar, Tag } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';

const ChatPage = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Ticket not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Ticket #{ticket.ticket_number}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {ticket.category}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
                {user.role !== 'student' && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {ticket.student.full_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="h-[calc(100vh-180px)]">
          <ChatWindow ticketId={ticketId} currentUser={user} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;