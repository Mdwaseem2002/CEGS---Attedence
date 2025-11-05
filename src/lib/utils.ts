// src/lib/utils.ts
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const calculateWorkingHours = (loginTime: string, logoutTime: string): number => {
  const login = new Date(`2000-01-01 ${loginTime}`);
  const logout = new Date(`2000-01-01 ${logoutTime}`);
  const diff = logout.getTime() - login.getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};

export const isLateLogin = (loginTime: string): boolean => {
  const [hours, minutes] = loginTime.split(':').map(Number);
  return hours > 10 || (hours === 10 && minutes > 15);
};
