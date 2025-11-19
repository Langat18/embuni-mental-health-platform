// frontend/src/services/authService.js
import api from './api';

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} Response with user data and tokens
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  return response.data.data;
};

/**
 * Register student
 * @param {Object} studentData 
 * @returns {Promise}
 */
export const registerStudent = async (studentData) => {
  const response = await api.post('/auth/register', {
    ...studentData,
    role: 'student'
  });
  return response.data.data;
};

/**
 * Register counselor
 * @param {Object} counselorData 
 * @returns {Promise}
 */
export const registerCounselor = async (counselorData) => {
  const response = await api.post('/auth/register', {
    ...counselorData,
    role: 'counselor'
  });
  return response.data.data;
};

/**
 * Refresh access token
 * @param {string} refreshToken 
 * @returns {Promise}
 */
export const refreshAccessToken = async (refreshToken) => {
  const response = await api.post('/auth/refresh', {
    refresh_token: refreshToken
  });
  return response.data.data;
};

/**
 * Logout user
 * @returns {Promise}
 */
export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

/**
 * Request password reset
 * @param {string} email 
 * @returns {Promise}
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token
 * @param {string} resetToken 
 * @param {string} newPassword 
 * @returns {Promise}
 */
export const resetPassword = async (resetToken, newPassword) => {
  const response = await api.post('/auth/reset-password', {
    reset_token: resetToken,
    new_password: newPassword
  });
  return response.data;
};

/**
 * Verify email address
 * @param {string} verificationToken 
 * @returns {Promise}
 */
export const verifyEmail = async (verificationToken) => {
  const response = await api.get(`/auth/verify-email/${verificationToken}`);
  return response.data;
};

/**
 * Submit student consent
 * @param {string} consentVersion 
 * @param {boolean} consentGiven 
 * @returns {Promise}
 */
export const submitConsent = async (consentVersion, consentGiven) => {
  const response = await api.post('/auth/consent', {
    consent_version: consentVersion,
    consent_given: consentGiven
  });
  return response.data.data;
};