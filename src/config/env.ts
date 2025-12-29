// Frontend Environment Configuration
// All environment variables should be prefixed with VITE_

export const API_CONFIG = {
  URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};

export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  ENABLED: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_CONFIG.URL);
  if (GOOGLE_CONFIG.ENABLED) {
    console.log('✅ Google OAuth enabled');
  } else {
    console.log('⚠️  Google OAuth not configured (optional)');
  }
}

