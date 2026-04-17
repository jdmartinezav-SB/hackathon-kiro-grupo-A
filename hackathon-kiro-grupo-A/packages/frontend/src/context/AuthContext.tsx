import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  companyName: string;
  role: string;
  businessProfile: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  businessProfile: string;
  contactName: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    return {
      accessToken: token,
      user: storedUser ? (JSON.parse(storedUser) as User) : null,
    };
  });

  const isAuthenticated = Boolean(authState.accessToken);

  useEffect(() => {
    if (authState.accessToken) {
      localStorage.setItem('accessToken', authState.accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }

    if (authState.user) {
      localStorage.setItem('user', JSON.stringify(authState.user));
    } else {
      localStorage.removeItem('user');
    }
  }, [authState]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ accessToken: string; consumer: User }>(
        '/v1/auth/login',
        { email, password },
      );
      const { accessToken, consumer } = response.data;
      setAuthState({ accessToken, user: consumer });
    },
    [],
  );

  const logout = useCallback(() => {
    setAuthState({ accessToken: null, user: null });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const register = useCallback(async (data: RegisterData) => {
    await api.post('/v1/auth/register', data);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        accessToken: authState.accessToken,
        isAuthenticated,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
