'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/firebaseClient';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Direct logout handler with immediate redirect
  const handleSignOut = () => {
    // Force an immediate redirect to a special logout URL with a timestamp to prevent caching
    window.location.replace(`/api/auth/logout?t=${Date.now()}`);
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
                onClick={handleSignOut} 
                className={styles.logoutButton}
              >
                Log Out
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
