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

  const [student, setStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('studentProfile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [studentToken, setStudentToken] = useState(() => localStorage.getItem('studentToken') || null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySessions() {
      // 1. Check teacher session
      const savedTeacherToken = localStorage.getItem('teacherToken');
      if (savedTeacherToken || teacher) {
        try {
          const data = await api.get('/auth/me');
          setTeacher(data);
          localStorage.setItem('teacherProfile', JSON.stringify(data));
        } catch {
          localStorage.removeItem('teacherToken');
          localStorage.removeItem('teacherProfile');
          setToken(null);
          setTeacher(null);
        }
      }

      // 2. Check student session
      const savedStudentToken = localStorage.getItem('studentToken');
      if (savedStudentToken || student) {
        try {
          const res = await api.get('/students/me');
          if (res?.data) {
            setStudent(res.data);
            localStorage.setItem('studentProfile', JSON.stringify(res.data));
          }
        } catch {
          localStorage.removeItem('studentToken');
          localStorage.removeItem('studentProfile');
          setStudentToken(null);
          setStudent(null);
        }
      }

      setLoading(false);
    }

    verifySessions();
  }, []);

  const login = (newToken, teacherData) => {
    // If logging in as teacher, clear student session to avoid conflicts
    studentLogout();
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

  const studentLogin = (newToken, studentData) => {
    // If logging in as student, clear teacher session
    logout();
    if (newToken) {
      localStorage.setItem('studentToken', newToken);
      setStudentToken(newToken);
    }
    if (studentData) {
      localStorage.setItem('studentProfile', JSON.stringify(studentData));
      setStudent(studentData);
    }
  };

  const studentLogout = async () => {
    try {
      await api.post('/students/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentProfile');
    setStudentToken(null);
    setStudent(null);
  };

  const updateStudentClass = (classData) => {
    setStudent((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, class: classData };
      localStorage.setItem('studentProfile', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTeacherProfile = (updatedData) => {
    setTeacher((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('teacherProfile', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        token,
        student,
        studentToken,
        userRole: teacher ? 'teacher' : student ? 'student' : null,
        loading,
        login,
        logout,
        studentLogin,
        studentLogout,
        updateStudentClass,
        updateTeacherProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
