import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const ChatWindow = ({ ticketId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/tickets/${ticketId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setMessages(await res.json());
      } catch (err) {
        console.error('Failed to load message history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [ticketId]);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const websocket = new WebSocket(`${WS}/ws/chat/${ticketId}?token=${token}`);

    websocket.onopen = () => {
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => {
        // avoid duplicates if message already exists from history
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    websocket.onerror = () => setConnected(false);
    websocket.onclose = () => setConnected(false);

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) websocket.close();
    };
  }, [ticketId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws || !connected) return;
    ws.send(JSON.stringify({ message: newMessage }));
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-gray-900">Ticket #{ticketId}</h3>
          <p className="text-sm">
            {connected
              ? <span className="text-green-600">● Connected</span>
              : <span className="text-red-600">● Disconnected</span>
            }
          </p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender_id === currentUser?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-xs font-medium mb-1 opacity-75">{msg.sender?.full_name}</p>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <button type="button" className="p-2 hover:bg-gray-100 rounded-full" disabled>
            <Paperclip className="h-5 w-5 text-gray-400" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
            placeholder={connected ? 'Type your message...' : 'Connecting...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400"
            disabled={!connected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !connected}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {!connected && (
          <p className="text-xs text-red-500 mt-2">
            Not connected. Check your internet connection or try refreshing.
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;