'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components';
import styles from './login.module.css';
import Image from 'next/image';
import { auth } from '@/lib/firebase/firebaseClient';

// Login page component - Main entry point to the application
export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedOut = searchParams.get('signedOut');
  const [processingSignOut, setProcessingSignOut] = useState(false);
  
  // Handle signed out state from URL parameter
  useEffect(() => {
    // If we just signed out, ensure we clear any remaining Firebase auth state
    if (signedOut === 'true' && !processingSignOut) {
      setProcessingSignOut(true);
      
      const completeSignOut = async () => {
        try {
          // Force Firebase to clear any persisted auth state
          await auth.signOut();
          
          // Clear any Firebase-related data from storage
          localStorage.removeItem('firebase:auth:user');
          localStorage.removeItem('firebase:authUser');
          sessionStorage.clear();
          
          console.log('Successfully cleared auth state');
        } catch (error) {
          console.error('Error clearing auth state:', error);
        } finally {
          setProcessingSignOut(false);
        }
      };
      
      completeSignOut();
    }
  }, [signedOut, processingSignOut]);
  
  // Redirect to home if already logged in and not just signed out
  useEffect(() => {
    if (user && !signedOut && !processingSignOut) {
      router.push('/');
    }
  }, [user, router, signedOut, processingSignOut]);

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
          
          {signedOut === 'true' && (
            <div className={styles.signOutMessage}>
              <p>You have been successfully logged out.</p>
            </div>
          )}
        </div>
        <LoginForm />
        <div className={styles.footer}>
          <p> {new Date().getFullYear()} Healthcare Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
