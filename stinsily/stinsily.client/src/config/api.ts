export const API_BASE_URL = 'https://id-46.pslib.cloud';

export const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  const baseUrl = 'https://id-46.pslib.cloud/api';
  return `${baseUrl}${imageUrl}`;
};