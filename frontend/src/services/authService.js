import api from './api';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  return response.data;
};

export const registerStudent = async (studentData) => {
  const response = await api.post('/auth/register/student', studentData);
  return response.data;
};

export const registerCounselor = async (counselorData) => {
  const response = await api.post('/auth/register/counselor', counselorData);
  return response.data;
};

export const refreshAccessToken = async (refreshToken) => {
  const response = await api.post('/auth/refresh', {
    refresh_token: refreshToken
  });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (resetToken, newPassword) => {
  const response = await api.post('/auth/reset-password', {
    reset_token: resetToken,
    new_password: newPassword
  });
  return response.data;
};

export const verifyEmail = async (verificationToken) => {
  const response = await api.get(`/auth/verify-email/${verificationToken}`);
  return response.data;
};

export const submitConsent = async (consentVersion, consentGiven) => {
  const response = await api.post('/auth/consent', {
    consent_version: consentVersion,
    consent_given: consentGiven
  });
  return response.data;
};
