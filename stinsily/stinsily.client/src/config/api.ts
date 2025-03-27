export const API_BASE_URL = 'https://id-46.pslib.cloud';

export const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  // Remove any leading slash to avoid double slashes
  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  // Add _content/stinsily.Server prefix for static files
  return `${API_BASE_URL}/_content/stinsily.Server/${cleanImageUrl}`;
};