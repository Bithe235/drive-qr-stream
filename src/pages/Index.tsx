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
    localStorage.removeItem('isAdminLoggedIn');
    setCurrentView('login');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToUser = () => {
    setCurrentView('user');
  };

  const handleSwitchToAdmin = () => {
    if (isAdminLoggedIn) {
      setCurrentView('admin');
    } else {
      setCurrentView('login');
    }
  };

  if (currentView === 'login') {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <div>
        <div className="absolute top-4 right-4">
          <button 
            onClick={handleSwitchToUser}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Switch to User View
          </button>
        </div>
        <AdminPanel onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div>
      <div className="absolute top-4 right-4">
        <button 
          onClick={handleSwitchToAdmin}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Admin Panel
        </button>
      </div>
      <UserPanel onBackToLogin={handleBackToLogin} />
    </div>
  );
};

export default Index;