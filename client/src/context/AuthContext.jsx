import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(() => {
    try {
      const saved = localStorage.getItem('teacherProfile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('teacherToken') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const data = await api.get('/auth/me');
        setTeacher(data);
        localStorage.setItem('teacherProfile', JSON.stringify(data));
      } catch (err) {
        // If cookie/token invalid or expired, clear local session
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacherProfile');
        setToken(null);
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = (newToken, teacherData) => {
    if (newToken) {
      localStorage.setItem('teacherToken', newToken);
      setToken(newToken);
    }
    if (teacherData) {
      localStorage.setItem('teacherProfile', JSON.stringify(teacherData));
      setTeacher(teacherData);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherProfile');
    setToken(null);
    setTeacher(null);
  };

  return (
    <AuthContext.Provider value={{ teacher, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
