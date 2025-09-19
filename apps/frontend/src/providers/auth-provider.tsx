import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, ApiResponse } from '../lib/api';
import { toast } from 'sonner';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchMe = async () => {
    try {
      const { data } = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
      setUser(data.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken: string }>>(
        '/auth/login',
        { email, password }
      );
      localStorage.setItem('jianhao-access-token', data.data.accessToken);
      setUser(data.data.user);
      toast.success('欢迎回来，' + data.data.user.displayName);
      const redirectTo = (location.state as { from?: string })?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || '登录失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password, displayName });
      toast.success('注册成功，请登录');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '注册失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('jianhao-access-token');
      setUser(null);
      navigate('/login');
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    hasPermission: (permission: string) => !!user?.permissions.includes(permission)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
