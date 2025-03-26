export const API_BASE_URL = 'https://id-46.pslib.cloud';

export const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  const baseUrl = import.meta.env.PROD ? 'https://id-46.pslib.cloud' : 'http://localhost:5193';
  return `${baseUrl}${imageUrl}`;
};