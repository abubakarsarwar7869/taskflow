import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_CONFIG } from '@/config/env';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: { message: string } | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('taskflow_token');
      const storedUser = localStorage.getItem('taskflow_user');
      
      if (token && storedUser) {
        try {
          // Verify token is still valid by calling /me endpoint
          const response = await fetch(`${API_CONFIG.URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: userData._id || userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role === 'admin' ? 'admin' : 'user',
            });
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('taskflow_token');
            localStorage.removeItem('taskflow_user');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('taskflow_token');
          localStorage.removeItem('taskflow_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: { message: string } | null }> => {
    try {
      const apiEndpoint = `${API_CONFIG.URL}/auth/login`;
      console.log('🔐 Attempting login:', { email, apiUrl: apiEndpoint });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('❌ Login failed:', errorMessage);
        return { error: { message: errorMessage } };
      }

      const data = await response.json();
      console.log('✅ Login successful:', { email: data.email, name: data.name });

      const userData = {
        id: String(data._id || data.id),
        email: String(data.email),
        name: String(data.name),
        role: (data.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
      };

      setUser(userData);
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(userData));

      return { error: null };
    } catch (error: any) {
      console.error('❌ Network error during login:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        apiUrl: API_CONFIG.URL
      });
      
      let errorMessage = 'Network error. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server may be slow or not responding. Please check if the backend server is running on http://localhost:5000';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = `Cannot connect to server at ${API_CONFIG.URL}. 
        Please check:
        1. Is the backend server running? (Run: cd server && npm run dev)
        2. Is the server accessible at http://localhost:5000?
        3. Check browser console (F12) for detailed errors
        4. Verify CORS is configured correctly`;
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      return { error: { message: errorMessage } };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error: { message: string } | null }> => {
    try {
      const apiEndpoint = `${API_CONFIG.URL}/auth/register`;
      console.log('📝 Attempting signup:', { email, name, apiUrl: apiEndpoint });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('❌ Signup failed:', errorMessage);
        return { error: { message: errorMessage } };
      }

      const data = await response.json();
      console.log('✅ Signup successful:', data.email);

      const userData = {
        id: String(data._id || data.id),
        email: String(data.email),
        name: String(data.name),
        role: (data.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
      };

      setUser(userData);
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(userData));

      return { error: null };
    } catch (error: any) {
      console.error('❌ Network error during signup:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        apiUrl: API_CONFIG.URL
      });
      
      let errorMessage = 'Network error. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server may be slow or not responding. Please check if the backend server is running on http://localhost:5000';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = `Cannot connect to server at ${API_CONFIG.URL}. 

Please check:
1. Is the backend server running? (Run: cd server && npm run dev)
2. Is the server accessible at http://localhost:5000?
3. Check browser console (F12) for detailed errors
4. Verify CORS is configured correctly`;
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      
      return { error: { message: errorMessage } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = `${API_CONFIG.URL}/auth/google`;
    } catch (error: any) {
      console.error('❌ Google login error:', error);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
