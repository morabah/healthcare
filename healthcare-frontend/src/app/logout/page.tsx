'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/firebaseClient';

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // First clear any stored auth data from localStorage/sessionStorage
        localStorage.removeItem('firebase:auth:user');
        sessionStorage.clear();
        
        // Then sign out from Firebase directly
        await auth.signOut();
        
        // Also call our context's logout method
        await logout();
        
        // Redirect to login page
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
        // If there's an error, still try to redirect
        window.location.href = '/login';
      }
    };

    performLogout();
  }, [logout]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p>Please wait while we securely log you out.</p>
      </div>
    </div>
  );
}
