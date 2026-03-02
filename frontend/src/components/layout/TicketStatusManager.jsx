import React, { useState } from 'react';
import axios from 'axios';
import { Check, X, RotateCcw, MessageSquare, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TicketStatusManager = ({ ticket, onStatusUpdate, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/tickets/${ticket.id}/update-status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        onStatusUpdate({
          ...response.data,
          type: 'success'
        });
        setShowConfirm(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      onStatusUpdate({
        success: false,
        message: error.response?.data?.detail || 'Failed to update ticket status',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tickets/${ticket.id}/mark-resolved`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        onStatusUpdate({
          ...response.data,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error marking resolved:', error);
      onStatusUpdate({
        success: false,
        message: error.response?.data?.detail || 'Failed to mark ticket as resolved',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tickets/${ticket.id}/close`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        onStatusUpdate({
          ...response.data,
          type: 'success'
        });
        setShowConfirm(null);
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      onStatusUpdate({
        success: false,
        message: error.response?.data?.detail || 'Failed to close ticket',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tickets/${ticket.id}/reopen`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        onStatusUpdate({
          ...response.data,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error reopening ticket:', error);
      onStatusUpdate({
        success: false,
        message: error.response?.data?.detail || 'Failed to reopen ticket',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCounselorActions = () => {
    switch (ticket.status) {
      case 'assigned':
        return (
          <button
            onClick={() => handleStatusUpdate('active')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Start Session
          </button>
        );
      
      case 'active':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate('follow_up')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              Schedule Follow-up
            </button>
            <button
              onClick={handleMarkResolved}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              <Check className="h-4 w-4" />
              Mark Resolved
            </button>
          </div>
        );
      
      case 'follow_up':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate('active')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              Resume Session
            </button>
            <button
              onClick={handleMarkResolved}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              <Check className="h-4 w-4" />
              Mark Resolved
            </button>
          </div>
        );
      
      case 'resolved':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate('active')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              Reactivate
            </button>
            <button
              onClick={() => setShowConfirm('close')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              <X className="h-4 w-4" />
              Close Ticket
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderStudentActions = () => {
    if (ticket.status === 'resolved') {
      return (
        <button
          onClick={() => setShowConfirm('close')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          <Check className="h-4 w-4" />
          Close as Resolved
        </button>
      );
    }
    
    if (ticket.status === 'closed') {
      return (
        <button
          onClick={handleReopen}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Reopen Ticket
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Ticket Actions:</span>
        
        <div>
          {userRole === 'student' ? renderStudentActions() : renderCounselorActions()}
        </div>
      </div>

      {showConfirm === 'close' && (
        <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                {userRole === 'student' ? 'Confirm Ticket Closure' : 'Close This Ticket?'}
              </h4>
              <p className="text-sm text-gray-700 mb-4">
                {userRole === 'student' 
                  ? 'Are you satisfied with the resolution? This will close the ticket.'
                  : 'This will close the ticket. The student can reopen it if needed.'
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium shadow-sm"
                >
                  Yes, Close Ticket
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketStatusManager;