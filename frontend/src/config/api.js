// frontend/src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || '';

console.log('API URL:', API_URL); // Debug log

export const getApiUrl = (endpoint) => {
  // If endpoint already starts with http, return as-is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // If we have API_URL, prepend it
  if (API_URL) {
    return `${API_URL}${endpoint}`;
  }
  
  // Otherwise use relative path (for local dev with proxy)
  return endpoint;
};

export default API_URL;