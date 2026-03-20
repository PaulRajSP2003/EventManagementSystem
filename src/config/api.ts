export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export const HUB_BASE = API_BASE.replace(/\/api\/?$/, '');
