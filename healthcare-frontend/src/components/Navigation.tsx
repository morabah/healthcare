'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
              <Link href="/" className={styles.navLink}>Dashboard</Link>
              <Link href="/profile" className={styles.navLink}>Profile</Link>
              <Link href="/appointments" className={styles.navLink}>Appointments</Link>
              <Link href="/records" className={styles.navLink}>Medical Records</Link>
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
