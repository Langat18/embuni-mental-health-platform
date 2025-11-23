// Email validation for Embuni Mental Health Platform

export const EmailPatterns = {
  STUDENT: /^\d{5}@student\.embuni\.ac\.ke$/,
  STAFF: /^[a-z]+\.[a-z]+@embuni\.ac\.ke$/,
  ADMIN: /^admin@embuni\.ac\.ke$/
};

// Validate email based on expected role
export const validateEmail = (email, expectedRole) => {
  const emailLower = email.toLowerCase().trim();
  
  switch (expectedRole) {
    case 'student':
      if (!EmailPatterns.STUDENT.test(emailLower)) {
        return {
          valid: false,
          message: 'Student email must be in format: 12345@student.embuni.ac.ke (5 digits)'
        };
      }
      return { valid: true };
      
    case 'staff':
    case 'counsellor':
      if (!EmailPatterns.STAFF.test(emailLower)) {
        return {
          valid: false,
          message: 'Staff email must be in format: firstname.lastname@embuni.ac.ke'
        };
      }
      return { valid: true };
      
    case 'admin':
      if (!EmailPatterns.ADMIN.test(emailLower)) {
        return {
          valid: false,
          message: 'Invalid admin email'
        };
      }
      return { valid: true };
      
    default:
      return { valid: false, message: 'Invalid role specified' };
  }
};

// Extract 5-digit student ID
export const extractStudentId = (email) => {
  const match = email.match(/^(\d{5})@student\.embuni\.ac\.ke$/);
  return match ? match[1] : null;
};

// Extract staff names from email
export const extractStaffName = (email) => {
  const match = email.match(/^([a-z]+)\.([a-z]+)@embuni\.ac\.ke$/);
  if (match) {
    const firstName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const lastName = match[2].charAt(0).toUpperCase() + match[2].slice(1);
    return { firstName, lastName, fullName: `${firstName} ${lastName}` };
  }
  return null;
};

// Detect role based on email structure
export const detectRoleFromEmail = (email) => {
  const emailLower = email.toLowerCase().trim();
  
  if (EmailPatterns.STUDENT.test(emailLower)) return 'student';
  if (EmailPatterns.ADMIN.test(emailLower)) return 'admin';
  if (EmailPatterns.STAFF.test(emailLower)) return 'staff';

  return null;
};

// Check if email belongs to Embuni domain
export const isEmbuniEmail = (email) => {
  const emailLower = email.toLowerCase().trim();
  return emailLower.endsWith('@student.embuni.ac.ke') || 
         emailLower.endsWith('@embuni.ac.ke');
};

// Format phone number to Kenya standard (+254...)
export const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return '+' + cleaned;
};

// Validate Kenyan phone numbers
export const isValidKenyanPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 12 && cleaned.startsWith('254')) return true;
  if (cleaned.length === 10 && cleaned.startsWith('0')) return true;
  if (cleaned.length === 9 && !cleaned.startsWith('0')) return true;

  return false;
};
