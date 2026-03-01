import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, User, Clock, Trash2, FileText, X, ShieldOff } from 'lucide-react';
import TicketStatusManager from '../components/layout/TicketStatusManager';
import ToastNotification from '../components/common/ToastNotification';
import { API_BASE_URL, WS_BASE_URL } from '../config';

const ChatPage = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [toast, setToast] = useState(null);

  // Delete history state (student)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Session note state (counselor)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [existingNote, setExistingNote] = useState(null);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Fetch ticket details only (NO message history loaded — session-only) ──
  const fetchTicketDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const ticketData = await res.json();
        setTicket(ticketData);

        // Seed with initial message so the chat isn't completely empty on first open
        if (ticketData.initial_message) {
          setMessages([{
            id: 'initial',
            message: ticketData.initial_message,
            sender_id: ticketData.student_id,
            created_at: ticketData.created_at,
            sender: ticketData.student,
          }]);
        }
      }

      // If counselor, also fetch any existing session note
      if (user?.role !== 'student') {
        const noteRes = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/session-note`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (noteRes.ok) {
          const noteData = await noteRes.json();
          setExistingNote(noteData.note || null);
          setSessionNote(noteData.note || '');
        }
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  }, [ticketId, user?.role]);

  // ── WebSocket ──
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${ticketId}?token=${token}`);

    ws.onopen = () => setWsConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    ws.onerror = () => setWsConnected(false);
    ws.onclose = () => setWsConnected(false);
    wsRef.current = ws;
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [fetchTicketDetails, connectWebSocket]);

  // Close WS when ticket closes, prompt counselor for session note
  useEffect(() => {
    if (ticket?.status === 'closed') {
      wsRef.current?.close();
      // Prompt counselor to write session note when ticket is closed
      if (user?.role !== 'student' && !existingNote) {
        setShowNoteModal(true);
      }
    }
  }, [ticket?.status]);

  // ── Send message ──
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setSending(true);
    try {
      wsRef.current.send(JSON.stringify({ message: newMessage.trim() }));
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // ── Delete chat history (student) ──
  const handleDeleteHistory = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/messages`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Keep only the initial message as a stub
        setMessages(ticket?.initial_message ? [{
          id: 'initial',
          message: ticket.initial_message,
          sender_id: ticket.student_id,
          created_at: ticket.created_at,
          sender: ticket.student,
        }] : []);
        setShowDeleteConfirm(false);
        setToast({ message: 'Chat history cleared successfully.', type: 'success' });
      } else {
        setToast({ message: 'Failed to clear history. Please try again.', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to clear history. Please try again.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Save session note (counselor) ──
  const handleSaveNote = async () => {
    if (!sessionNote.trim()) return;
    setSavingNote(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/session-note`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: sessionNote.trim() }),
      });
      if (res.ok) {
        setExistingNote(sessionNote.trim());
        setShowNoteModal(false);
        setToast({ message: 'Session note saved successfully.', type: 'success' });
      } else {
        setToast({ message: 'Failed to save note. Please try again.', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to save note. Please try again.', type: 'error' });
    } finally {
      setSavingNote(false);
    }
  };

  const handleStatusUpdate = (updateResponse) => {
    if (updateResponse.success) setTicket((prev) => ({ ...prev, status: updateResponse.new_status }));
    setToast({ message: updateResponse.message, type: updateResponse.type || (updateResponse.success ? 'success' : 'error') });
  };

  const handleBack = () => {
    user?.role === 'student' ? navigate('/student/dashboard') : navigate('/counselor/dashboard');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const diffH = Math.abs(new Date() - date) / 36e5;
    return diffH < 24
      ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusBadgeColor = (status) => {
    const map = {
      new: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      follow_up: 'bg-purple-100 text-purple-800',
      resolved: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const isClosed = ticket?.status === 'closed';
  const canSend = !sending && !isClosed && wsConnected && newMessage.trim();
  const isStudent = user?.role === 'student';
  const isCounselor = !isStudent;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conversation not found</p>
          <button onClick={handleBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Delete History Confirm Modal (student) ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldOff className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Clear Chat History?</h3>
                <p className="text-sm text-gray-600">
                  This will permanently delete all messages in this conversation. This action cannot be undone.
                </p>
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  ⚠️ Your counselor's session notes will not be deleted — only the raw chat messages.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteHistory}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Clearing...' : 'Yes, Clear History'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session Note Modal (counselor) ── */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Session Note</h3>
                  <p className="text-sm text-gray-500">Ticket #{ticket.ticket_number}</p>
                </div>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              📝 Write a brief clinical note summarising this session. Raw chat messages are not stored permanently — this note is the only record that will be retained.
            </p>

            <textarea
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="e.g. Student presented with anxiety related to upcoming exams. Discussed coping strategies including breathing exercises and time management. Follow-up recommended in 2 weeks."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1 mb-4">{sessionNote.length} characters</p>

            <div className="flex gap-3">
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !sessionNote.trim()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {isStudent ? ticket.counselor?.full_name || 'Counselor' : ticket.student?.full_name || 'Student'}
                </h2>
                <p className="text-sm text-gray-500">{ticket.category} • #{ticket.ticket_number}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {wsConnected ? '● Live' : '● Offline'}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusBadgeColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>

            {/* Student: clear history button */}
            {isStudent && messages.length > 1 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Clear chat history"
                className="p-2 hover:bg-red-50 rounded-full transition text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Counselor: session note button */}
            {isCounselor && (
              <button
                onClick={() => setShowNoteModal(true)}
                title={existingNote ? 'Edit session note' : 'Add session note'}
                className={`p-2 rounded-full transition flex items-center gap-1 text-xs font-medium px-3 ${
                  existingNote
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                {existingNote ? 'Note saved ✓' : 'Add note'}
              </button>
            )}
          </div>
        </div>

        {/* Privacy notice */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg mb-2 text-xs text-gray-500">
          <ShieldOff className="w-3 h-3 flex-shrink-0" />
          <span>
            {isStudent
              ? 'Messages are session-only and not stored permanently. You can clear your history at any time.'
              : 'Raw messages are not stored permanently. Use the session note to record clinical observations.'}
          </span>
        </div>

        <TicketStatusManager ticket={ticket} onStatusUpdate={handleStatusUpdate} userRole={user?.role} />
      </div>

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isMe ? 'ml-12' : 'mr-12'}`}>
                {!isMe && <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.full_name || 'User'}</p>}
                <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
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

      {/* ── Input bar ── */}
      <div className="bg-white border-t p-4 shadow-lg">
        {isClosed && (
          <div className="text-center mb-3">
            <p className="text-sm text-gray-500 mb-1">This conversation is closed.</p>
            {isStudent && (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-500 hover:text-red-600 underline">
                Clear my chat history
              </button>
            )}
            {isCounselor && !existingNote && (
              <button onClick={() => setShowNoteModal(true)} className="text-xs text-blue-600 hover:text-blue-700 underline">
                Write a session note
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isClosed ? 'Conversation closed' : 'Type your message...'}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
            disabled={isClosed || !wsConnected}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;