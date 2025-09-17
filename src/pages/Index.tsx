import { useState, useEffect } from 'react';
import { AdminPanel } from '@/components/AdminPanel';
import { UserPanel } from '@/components/UserPanel';

const Index = () => {
  const [isAdminMode, setIsAdminMode] = useState(true);

  const handleToggleMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  const handleLogout = () => {
    setIsAdminMode(true);
  };

  if (isAdminMode) {
    return (
      <div>
        <div className="absolute top-4 right-4">
          <button 
            onClick={handleToggleMode}
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
          onClick={handleToggleMode}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Switch to Admin View
        </button>
      </div>
      <UserPanel onBackToLogin={handleLogout} />
    </div>
  );
};

export default Index;