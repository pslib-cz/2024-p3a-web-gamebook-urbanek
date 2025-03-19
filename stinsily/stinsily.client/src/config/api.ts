export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://id-46.pslib.cloud/api'  // Production: use absolute URL for the server
  : 'http://localhost:5193/api';  // Development: use localhost

export const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  const baseUrl = import.meta.env.PROD ? 'https://id-46.pslib.cloud' : 'http://localhost:5193';
  return `${baseUrl}${imageUrl}`;
}; 