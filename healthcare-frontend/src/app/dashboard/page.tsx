'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createLogger } from '@/lib/logger';

// Create logger for dashboard redirection
const dashboardLogger = createLogger('dashboard-redirect');

export default function DashboardRedirect() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip redirection if still loading auth state
    if (loading) {
      dashboardLogger.debug('Auth state is still loading, waiting...');
      return;
    }

    // Redirect to login if not authenticated
    if (!user) {
      dashboardLogger.info('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Determine the correct dashboard based on user role
    if (userData?.role) {
      const targetDashboard = userData.role === 'doctor' 
        ? '/doctor-dashboard' 
        : '/patient-dashboard';
      
      dashboardLogger.info(`Redirecting to ${targetDashboard} based on role: ${userData.role}`);
      router.push(targetDashboard);
    } else {
      // If we somehow have a user but no role, default to patient dashboard
      dashboardLogger.warn('User authenticated but has no role, defaulting to patient dashboard');
      router.push('/patient-dashboard');
    }
  }, [user, userData, loading, router]);

  // Display a simple loading state while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid rgba(0, 123, 255, 0.3)', 
        borderTop: '3px solid #007bff', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h2>Redirecting to your dashboard...</h2>
      <p>Please wait a moment</p>
    </div>
  );
}
