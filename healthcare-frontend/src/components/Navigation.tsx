'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './Navigation.module.css';

export default function Navigation() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
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

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Home</Link>
          {/* Add more navigation links as needed */}
        </div>

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
