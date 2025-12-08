export const maskName = (fullName, userRole) => {
  if (!fullName) return 'Unknown';
  
  if (userRole === 'admin') {
    return fullName;
  }
  
  const nameParts = fullName.trim().split(' ');
  
  const maskedParts = nameParts.map(part => {
    if (part.length === 0) return '';
    return part.charAt(0) + '*'.repeat(part.length - 1);
  });
  
  return maskedParts.join(' ');
};

export const maskEmail = (email, userRole) => {
  if (!email) return 'Unknown';
  
  if (userRole === 'admin') {
    return email;
  }
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  const maskedLocal = localPart.charAt(0) + '*'.repeat(Math.max(localPart.length - 1, 3));
  return `${maskedLocal}@${domain}`;
};
