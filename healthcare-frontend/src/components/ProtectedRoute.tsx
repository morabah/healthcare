'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'patient' | 'doctor' | undefined;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push('/login');
      } else if (requiredRole && userData && userData.role !== requiredRole) {
        // User is authenticated but doesn't have the required role
        // Redirect to the appropriate dashboard based on their role
        if (userData.role === 'doctor') {
          router.push('/doctor-dashboard');
        } else {
          router.push('/profile');
        }
      }
    }
  }, [user, userData, loading, router, requiredRole]);

  // Show nothing while checking authentication
  if (loading || !user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        color: '#4a5568'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(66, 153, 225, 0.3)',
          borderRadius: '50%',
          borderTopColor: '#4299e1',
          animation: 'spin 1s ease-in-out infinite'
        }}></div>
        <p>Loading...</p>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // If requiredRole is specified and user doesn't have it, don't render children
  // (the useEffect above will handle redirection)
  if (requiredRole && userData && userData.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
}
