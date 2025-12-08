import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, User, Clock } from 'lucide-react';

const ChatPage = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchTicketDetails();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        
        if (data.initial_message) {
          setMessages([{
            id: 'initial',
            message: data.initial_message,
            sender_id: data.student_id,
            created_at: data.created_at,
            sender: data.student
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('token');
      const wsUrl = `ws://localhost:8000/ws/chat/${ticketId}?token=${token}`;
      
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) {
            return prev;
          }
          return [...prev, data];
        });
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(websocket);
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    setSending(true);

    try {
      ws.send(JSON.stringify({
        message: newMessage.trim()
      }));

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (user.role === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/counselor/dashboard');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
          <p className="text-gray-600 mb-4">Conversation not found</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-4 shadow-sm">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {user.role === 'student' 
                  ? ticket.counselor?.full_name || 'Counselor'
                  : ticket.student?.full_name || 'Student'}
              </h2>
              <p className="text-sm text-gray-500">
                {ticket.category} • #{ticket.ticket_number}
              </p>
            </div>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          ticket.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {ticket.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user.id;
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isMe ? 'ml-12' : 'mr-12'}`}>
                {!isMe && (
                  <p className="text-xs text-gray-500 mb-1 ml-1">
                    {msg.sender?.full_name || 'User'}
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    isMe ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
