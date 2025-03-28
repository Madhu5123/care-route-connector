
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from './LogoutButton';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

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
          {userProfile?.verified === false && (
            <span className="rounded-full bg-yellow-100 text-yellow-800 px-2.5 py-0.5 text-xs font-medium flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending Verification
            </span>
          )}
          {userProfile?.verified === true && (
            <span className="rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-medium flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Welcome, </span>
            <span className="font-medium">{userProfile?.displayName || userProfile?.email}</span>
          </div>
          {userProfile?.role === 'admin' && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/dashboard">
                <Shield className="h-4 w-4 mr-1" />
                Admin Dashboard
              </Link>
            </Button>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
