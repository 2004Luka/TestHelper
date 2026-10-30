import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySessions() {
      try {
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('studentToken');
        localStorage.removeItem('teacherProfile');
        localStorage.removeItem('studentProfile');
      } catch {
        // Session state remains in memory when browser storage is unavailable.
      }

      try {
        const session = await api.get('/auth/session');
        if (session.role === 'teacher') {
          setTeacher(session.user);
          setStudent(null);
        } else if (session.role === 'student') {
          setTeacher(null);
          setStudent(session.user);
        } else {
          setTeacher(null);
          setStudent(null);
          await Promise.allSettled([api.post('/auth/logout'), api.post('/students/logout')]);
        }
      } catch {
        setTeacher(null);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }

    verifySessions();
  }, []);

  const login = (teacherData) => {
    setStudent(null);
    setTeacher(teacherData || null);
  };

  const logout = async () => {
    await Promise.allSettled([api.post('/auth/logout'), api.post('/students/logout')]);
    setTeacher(null);
    setStudent(null);
  };

  const studentLogin = (studentData) => {
    setTeacher(null);
    setStudent(studentData || null);
  };

  const studentLogout = async () => {
    await Promise.allSettled([api.post('/students/logout'), api.post('/auth/logout')]);
    setStudent(null);
    setTeacher(null);
  };

  const updateStudentClass = (classData) => {
    setStudent((prev) => {
      if (!prev) return prev;
      return { ...prev, class: classData };
    });
  };

  const updateTeacherProfile = (updatedData) => {
    setTeacher((prev) => {
      return { ...prev, ...updatedData };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        student,
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
