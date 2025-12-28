import { useState, useEffect, useCallback } from 'react';
import { Student, Admin, AdminRole } from '@/types';

const STUDENT_KEY = 'college_safety_student';
const ADMIN_KEY = 'college_safety_admin';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useAuth = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage
  useEffect(() => {
    const storedStudent = localStorage.getItem(STUDENT_KEY);
    const storedAdmin = localStorage.getItem(ADMIN_KEY);
    
    if (storedStudent) {
      setStudent(JSON.parse(storedStudent));
    }
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  // Student login with college ID
  const loginWithCollegeId = useCallback((collegeId: string, name: string) => {
    const newStudent: Student = {
      id: generateId(),
      collegeId,
      isGuest: false,
      name,
    };
    localStorage.setItem(STUDENT_KEY, JSON.stringify(newStudent));
    setStudent(newStudent);
    return newStudent;
  }, []);

  // Guest login
  const loginAsGuest = useCallback(() => {
    const guestNumber = Math.floor(Math.random() * 10000);
    const newStudent: Student = {
      id: generateId(),
      isGuest: true,
      name: `Guest_${guestNumber}`,
    };
    localStorage.setItem(STUDENT_KEY, JSON.stringify(newStudent));
    setStudent(newStudent);
    return newStudent;
  }, []);

  // Admin login
  const loginAsAdmin = useCallback((name: string, role: AdminRole, email: string, phone: string) => {
    const newAdmin: Admin = {
      id: generateId(),
      name,
      role,
      email,
      phone,
    };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(newAdmin));
    setAdmin(newAdmin);
    return newAdmin;
  }, []);

  // Logout student
  const logoutStudent = useCallback(() => {
    localStorage.removeItem(STUDENT_KEY);
    setStudent(null);
  }, []);

  // Logout admin
  const logoutAdmin = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
    setAdmin(null);
  }, []);

  // Check if admin can change status
  const canChangeStatus = useCallback((): boolean => {
    if (!admin) return false;
    return admin.role === 'security_head' || admin.role === 'principal';
  }, [admin]);

  return {
    student,
    admin,
    loading,
    loginWithCollegeId,
    loginAsGuest,
    loginAsAdmin,
    logoutStudent,
    logoutAdmin,
    canChangeStatus,
    isStudentLoggedIn: !!student,
    isAdminLoggedIn: !!admin,
  };
};
