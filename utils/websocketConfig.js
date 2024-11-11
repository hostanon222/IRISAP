export const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  
  const isProduction = process.env.NODE_ENV === 'production';
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  
  return `${protocol}://${host}/api/chat`;
}; 