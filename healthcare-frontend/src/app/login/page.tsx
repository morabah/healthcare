'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components';
import styles from './login.module.css';
import Image from 'next/image';

// Login page component - Updated and synced with GitHub
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
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
