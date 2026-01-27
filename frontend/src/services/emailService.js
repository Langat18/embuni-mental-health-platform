import api from './api';

export const sendEmailToCounselor = async (emailData) => {
  const response = await api.post('/email/send', {
    counselor_id: emailData.counselorId,
    subject: emailData.subject,
    message: emailData.message,
    is_urgent: emailData.isUrgent || false
  });
  return response.data.data;
};

export const replyToEmail = async (emailId, replyMessage) => {
  const response = await api.post(`/email/${emailId}/reply`, {
    message: replyMessage
  });
  return response.data.data;
};

export const getCounselorInbox = async (params = {}) => {
  const response = await api.get('/email/inbox', { params });
  return response.data.data;
};

export const getStudentSentEmails = async (params = {}) => {
  const response = await api.get('/email/sent', { params });
  return response.data.data;
};

export const markEmailAsRead = async (emailId) => {
  const response = await api.patch(`/email/${emailId}/read`);
  return response.data.data;
};

export const deleteEmail = async (emailId) => {
  const response = await api.delete(`/email/${emailId}`);
  return response.data;
};