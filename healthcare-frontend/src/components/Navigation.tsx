'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Prefetch common routes to improve navigation performance
  useEffect(() => {
    // Only prefetch if there's a user logged in to avoid unnecessary prefetching
    if (user) {
      // Prefetch based on user role for faster dashboard access
      if (userData?.role === 'doctor') {
        router.prefetch('/doctor-dashboard');
        router.prefetch('/doctor-profile');
        router.prefetch('/appointments');
      } else if (userData?.role === 'patient') {
        router.prefetch('/patient-dashboard');
        router.prefetch('/patient-profile');
        router.prefetch('/book-appointment');
      }
      
      // Common routes for all users
      router.prefetch('/dashboard');
      router.prefetch('/settings');
    } else {
      // For logged out users, prefetch login/signup pages
      router.prefetch('/login');
      router.prefetch('/signup');
    }
  }, [router, user, userData?.role]);

  // Enhanced logout handler that uses the AuthContext directly
  const handleLogout = async () => {
    try {
      // Prevent double-clicks
      if (isLoggingOut) return;
      setIsLoggingOut(true);

      // Show feedback in the UI
      const logoutButton = document.querySelector(`.${styles.logoutButton}`) as HTMLButtonElement;
      if (logoutButton) {
        logoutButton.innerText = 'Logging out...';
      }

      // Use the AuthContext logout function which is now more robust
      await logout();
      
      // Navigate to login page after successful logout
      // Use push instead of hard redirect to maintain state
      router.push('/login?signedOut=true');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Show error in UI temporarily
      const logoutButton = document.querySelector(`.${styles.logoutButton}`) as HTMLButtonElement;
      if (logoutButton) {
        logoutButton.innerText = 'Error logging out';
        setTimeout(() => {
          logoutButton.innerText = 'Log Out';
          setIsLoggingOut(false);
        }, 2000);
      }
      
      // Even if there's an error, try to redirect anyway
      setTimeout(() => {
        router.push('/login?signedOut=true');
      }, 1000);
    }
  };

  // Determine if the user is a doctor
  const isDoctor = userData?.role === 'doctor';

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoContainer}>
          <Image 
            src="/logo.svg" 
            alt="Healthcare Logo" 
            width={40} 
            height={40} 
            priority 
          />
          <span className={styles.logoText}>Healthcare</span>
        </Link>

        {user && (
          <>
            <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
              <Link href={isDoctor ? "/doctor-dashboard" : "/"} className={styles.navLink}>Dashboard</Link>
              <Link href={isDoctor ? "/doctor-profile" : "/profile"} className={styles.navLink}>Profile</Link>
              <Link href={isDoctor ? "/doctor-appointments" : "/appointments"} className={styles.navLink}>Appointments</Link>
              <Link href={isDoctor ? "/doctor-records" : "/records"} className={styles.navLink}>Medical Records</Link>
            </div>

            <button 
              className={styles.mobileMenuButton} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={styles.menuBar}></span>
              <span className={styles.menuBar}></span>
              <span className={styles.menuBar}></span>
            </button>
          </>
        )}

        <div className={styles.authContainer}>
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className={styles.logoutButton}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
