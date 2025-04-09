'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import DoctorProfileForm from '@/components/DoctorProfileForm';
import styles from './doctor-profile.module.css';
import { doctorService } from '@/lib/api';

export default function DoctorProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData && userData.role !== 'doctor') {
      router.push('/');
    }
  }, [userData, router]);

  useEffect(() => {
    const checkDoctorProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // Check if doctor profile exists - this will now use Firebase fallback if API fails
        const profile = await doctorService.getProfileByUserId(user.uid);
        // We don't need to do anything with the profile here,
        // just checking if the service works
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error checking doctor profile:', err);
        setError('Failed to load profile data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    if (user && userData?.role === 'doctor') {
      checkDoctorProfile();
    }
  }, [user, userData]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading doctor profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className={styles.fullScreenContainer}>
        <DoctorProfileForm />
      </div>
    </ProtectedRoute>
  );
}
