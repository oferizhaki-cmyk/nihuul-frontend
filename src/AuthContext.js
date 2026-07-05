import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // בדוק אם יש token בעת טעינת הדף
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserType = localStorage.getItem('user_type');
    
    if (savedToken && savedUserType) {
      setToken(savedToken);
      setUser({ user_type: savedUserType });
      setIsLoggedIn(true);
    }
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      console.log('🔵 Login attempt:', { email, apiUrl });
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('🔵 Response status:', response.status);

      const data = await response.json();
      
      console.log('🔵 Response data:', data);

      if (data.token && data.user_type) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_type', data.user_type);
        
        setToken(data.token);
        setUser({ user_type: data.user_type });
        setIsLoggedIn(true);
        
        console.log('✅ Login successful!');
        return true;
      } else {
        console.error('❌ No token in response');
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);