import { useState, useEffect } from 'react';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminPanel } from '@/components/AdminPanel';
import { UserPanel } from '@/components/UserPanel';

const Index = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'admin' | 'user'>('login');

  useEffect(() => {
    // Check if admin is already logged in
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (isLoggedIn) {
      setIsAdminLoggedIn(true);
      setCurrentView('admin');
    }
  }, []);

  const handleLogin = (isAdmin: boolean) => {
    if (isAdmin) {
      setIsAdminLoggedIn(true);
      setCurrentView('admin');
    } else {
      setCurrentView('user');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('login');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  if (currentView === 'admin' && isAdminLoggedIn) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (currentView === 'user') {
    return <UserPanel onBackToLogin={handleBackToLogin} />;
  }

  return <AdminLogin onLogin={handleLogin} />;
};

export default Index;
