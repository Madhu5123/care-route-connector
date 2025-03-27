
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from './LogoutButton';

const DashboardHeader = () => {
  const { userProfile } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-lg font-bold">LifeLine</Link>
          {userProfile?.role && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Welcome, </span>
            <span className="font-medium">{userProfile?.displayName || userProfile?.email}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
