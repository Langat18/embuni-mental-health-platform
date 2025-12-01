import React from 'react';
import { Calendar, Clock, User, MessageSquare } from 'lucide-react';

const TicketCard = ({ ticket }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {ticket.patientName || 'Patient Name'}
            </h3>
            <p className="text-sm text-gray-500">
              {ticket.patientEmail || 'patient@email.com'}
            </p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
          {ticket.status?.toUpperCase() || 'PENDING'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {ticket.appointmentDate ? formatDate(ticket.appointmentDate) : 'Not scheduled'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {ticket.appointmentDate ? formatTime(ticket.appointmentDate) : '--:--'}
            {ticket.duration && ` (${ticket.duration} min)`}
          </span>
        </div>

        {ticket.notes && (
          <div className="flex items-start gap-2 text-gray-600">
            <MessageSquare className="w-4 h-4 mt-1" />
            <p className="text-sm line-clamp-2">{ticket.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          View Details
        </button>
        {ticket.status === 'pending' && (
          <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            Confirm
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketCard;