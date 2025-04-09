'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login');
      } else if (userData) {
        // Redirect based on user role
        if (userData.role === 'doctor') {
          router.push('/doctor-dashboard');
        } else {
          // Redirect patients to the patient dashboard
          router.push('/patient-dashboard');
        }
      }
    }
  }, [user, userData, loading, router]);

  // Show a loading state while checking authentication
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      background: 'linear-gradient(to bottom right, #ebf8ff, #e6fffa)',
      color: '#4a5568'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(66, 153, 225, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#4299e1',
        animation: 'spin 1s ease-in-out infinite'
      }}></div>
      <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>Loading your healthcare dashboard...</p>
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
