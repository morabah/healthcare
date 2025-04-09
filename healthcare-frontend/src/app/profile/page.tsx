'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute, ProfileForm } from '@/components';
import Navigation from '@/components/Navigation';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // This page is protected - only authenticated users can access it
  return (
    <ProtectedRoute>
      <div className={styles.profilePage}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <h1 className={styles.title}>Patient Profile</h1>
            <ProfileForm />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
