'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components';
import styles from './login.module.css';
import Image from 'next/image';

// Login page component - Main entry point to the application
export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Redirect to home if already logged in
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <Image
            src="/logo.svg" 
            alt="Healthcare Logo"
            width={80}
            height={80}
            priority
          />
          <h1 className={styles.title}>Healthcare Portal</h1>
          <p className={styles.subtitle}>Secure access to your healthcare management system</p>
        </div>
        <LoginForm />
        <div className={styles.footer}>
          <p> {new Date().getFullYear()} Healthcare Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
