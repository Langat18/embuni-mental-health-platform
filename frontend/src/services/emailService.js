// frontend/src/services/emailService.js
import api from './api';

/**
 * Send email to counselor
 * @param {Object} emailData 
 * @returns {Promise}
 */
export const sendEmailToCounselor = async (emailData) => {
  const response = await api.post('/email/send', {
    counselor_id: emailData.counselorId,
    subject: emailData.subject,
    message: emailData.message,
    is_urgent: emailData.isUrgent || false
  });
  return response.data.data;
};

/**
 * Reply to student email
 * @param {string} emailId 
 * @param {string} replyMessage 
 * @returns {Promise}
 */
export const replyToEmail = async (emailId, replyMessage) => {
  const response = await api.post(`/email/${emailId}/reply`, {
    message: replyMessage
  });
  return response.data.data;
};

/**
 * Get counselor inbox
 * @param {Object} params 
 * @returns {Promise}
 */
export const getCounselorInbox = async (params = {}) => {
  const response = await api.get('/email/inbox', { params });
  return response.data.data;
};

/**
 * Get student sent emails
 * @param {Object} params 
 * @returns {Promise}
 */
export const getStudentSentEmails = async (params = {}) => {
  const response = await api.get('/email/sent', { params });
  return response.data.data;
};

/**
 * Mark email as read
 * @param {string} emailId 
 * @returns {Promise}
 */
export const markEmailAsRead = async (emailId) => {
  const response = await api.patch(`/email/${emailId}/read`);
  return response.data.data;
};

/**
 * Delete email
 * @param {string} emailId 
 * @returns {Promise}
 */
export const deleteEmail = async (emailId) => {
  const response = await api.delete(`/email/${emailId}`);
  return response.data;
};