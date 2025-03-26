const BASE_URL = import.meta.env.PROD 
    ? 'https://id-46.pslib.cloud'
    : 'http://localhost:5193';

export const API_BASE_URL = `${BASE_URL}/api`;

export const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    return `${BASE_URL}${imageUrl}`;
};