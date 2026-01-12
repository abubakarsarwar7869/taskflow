import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_CONFIG } from '@/config/env';
import { useTaskStore } from '@/store/taskStore';
import { socketService } from '@/lib/socket';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string, name: string, code: string, boardId?: string) => Promise<{ error: { message: string } | null }>;
  sendVerificationCode: (email: string) => Promise<{ error: { message: string } | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: { message: string } | null }>;
  completeOAuthLogin: (token: string, userData: { id: string, email: string, name: string, role?: 'admin' | 'user' }) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  sendVerificationCode: async () => ({ error: null }),
  signInWithGoogle: async () => { },
  signOut: async () => { },
  deleteAccount: async () => ({ error: null }),
  completeOAuthLogin: () => { },
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
              avatar: localStorage.getItem(`profile_avatar_${userData._id || userData.id}`) || '',
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

  // Initialize Socket.io when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('taskflow_token');
    if (user && token) {
      console.log('🔌 Initializing real-time synchronization for user:', user.name);
      useTaskStore.getState().initializeSocket(token, user.id);
    } else {
      socketService.disconnect();
    }
  }, [user]);

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
        avatar: localStorage.getItem(`profile_avatar_${data._id || data.id}`) || '',
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

  const sendVerificationCode = async (email: string): Promise<{ error: { message: string } | null }> => {
    try {
      const response = await fetch(`${API_CONFIG.URL}/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || 'Failed to send verification code' } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Network error' } };
    }
  };

  const signUp = async (email: string, password: string, name: string, code: string, boardId?: string): Promise<{ error: { message: string } | null }> => {
    try {
      const apiEndpoint = `${API_CONFIG.URL}/auth/register`;
      console.log('📝 Attempting signup:', { email, name, apiUrl: apiEndpoint, boardId });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, code, boardId }),
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
      // Preserve invitation params during Google redirect
      const urlParams = new URLSearchParams(window.location.search);
      const queryString = urlParams.toString();

      // Store in localStorage as backup in case backend doesn't propagate
      if (urlParams.get('invite') === 'true') {
        localStorage.setItem('taskflow_invite_context', JSON.stringify({
          invite: 'true',
          boardId: urlParams.get('boardId'),
          boardName: urlParams.get('boardName'),
          email: urlParams.get('email')
        }));
      }

      const redirectUrl = queryString
        ? `${API_CONFIG.URL}/auth/google?${queryString}`
        : `${API_CONFIG.URL}/auth/google`;

      // Redirect to Google OAuth endpoint
      window.location.href = redirectUrl;
    } catch (error: any) {
      console.error('❌ Google login error:', error);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_CONFIG.URL}/auth/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete account';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        return { error: { message: errorMessage } };
      }

      // Successful deletion - clear local state
      setUser(null);
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Network error during account deletion' } };
    }
  };

  const completeOAuthLogin = (token: string, userData: { id: string, email: string, name: string, role?: 'admin' | 'user' }) => {
    const userToSet: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      avatar: localStorage.getItem(`profile_avatar_${userData.id}`) || '',
    };

    // Set local storage first
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(userToSet));

    // Then set state - this will trigger AuthProvider re-render and anyone using useAuth()
    setUser(userToSet);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, sendVerificationCode, signInWithGoogle, signOut, deleteAccount, completeOAuthLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
