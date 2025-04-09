'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components';
import AuthDebugger from '@/components/AuthDebugger';
import styles from './login.module.css';
import Image from 'next/image';
import { auth, clearAuthState } from '@/lib/firebase/firebaseClient';

// Login page component - Main entry point to the application
export default function LoginPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedOut = searchParams.get('signedOut');
  const [processingSignOut, setProcessingSignOut] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Handle signed out state from URL parameter
  useEffect(() => {
    // If we just signed out, ensure we clear any remaining Firebase auth state
    if (signedOut === 'true' && !processingSignOut) {
      setProcessingSignOut(true);
      
      const completeSignOut = async () => {
        try {
          // Use the clearAuthState function to thoroughly clear auth state
          await clearAuthState();
          
          // Additional clearing of any lingering storage
          if (typeof window !== 'undefined') {
            // Clear Firebase-specific items that might have been missed
            const firebaseKeys = [
              'firebase:auth:user',
              'firebase:authUser',
              'firebase:persistence',
              'firebase:forceRefresh'
            ];
            
            firebaseKeys.forEach(key => {
              try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
              } catch (e) {
                // Ignore errors during cleanup
              }
            });
            
            // Clear IndexedDB for Firebase more thoroughly
            try {
              const dbs = await window.indexedDB.databases();
              dbs.forEach(db => {
                if (db.name && (db.name.includes('firebase') || db.name.includes('firestore'))) {
                  window.indexedDB.deleteDatabase(db.name);
                }
              });
            } catch (e) {
              console.warn('Unable to clear IndexedDB databases:', e);
            }
          }
          
          // Show success message
          setMessage({
            type: 'success',
            text: 'You have been successfully logged out.'
          });
          
          // Remove the signedOut query parameter to prevent refresh loops
          // But do this without causing a full page refresh
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('signedOut');
            window.history.replaceState({}, '', url.toString());
          }
        } catch (error) {
          console.error('Error clearing auth state:', error);
          setMessage({
            type: 'error',
            text: 'There was an issue during logout. Please clear your browser cookies and try again.'
          });
        } finally {
          setProcessingSignOut(false);
          
          // Set a longer timeout (10 seconds) to clear the message
          // The message will stay visible for 10 seconds
          setTimeout(() => {
            setMessage(null);
          }, 10000);
        }
      };
      
      completeSignOut();
    }
  }, [signedOut, processingSignOut]);
  
  // Only redirect to home if user is logged in AND we're not in the process of signing out
  useEffect(() => {
    // Add a slight delay to ensure Firebase auth state is properly initialized
    const redirectTimer = setTimeout(() => {
      if (user && !signedOut && !processingSignOut) {
        console.log('User is authenticated, redirecting to dashboard');
        
        // Check user role for appropriate redirect
        if (user.uid) {
          if (userData?.role === 'doctor') {
            router.push('/doctor-dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/');
        }
      }
    }, 500);
    
    return () => clearTimeout(redirectTimer);
  }, [user, router, signedOut, processingSignOut, userData]);

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
          
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`} style={{
              padding: '12px 20px',
              marginBottom: '20px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'opacity 0.5s ease-in-out',
              animation: 'fadeInOut 10s ease-in-out',
              opacity: '1'
            }}>
              {message.text}
            </div>
          )}
        </div>
        <LoginForm />
        <AuthDebugger />
        <div className={styles.footer}>
          <p> {new Date().getFullYear()} Healthcare Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
