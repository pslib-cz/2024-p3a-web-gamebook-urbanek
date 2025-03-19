export const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // Production: use relative path
  : 'http://localhost:5193/api';  // Development: use localhost

export const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:5193';
  return `${baseUrl}${imageUrl}`;
}; 