'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navigation from "@/components/Navigation"; 
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, show dashboard in the future
        // For now, we'll keep them on this page
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className={styles.page}>
        <Navigation />
        <main className={styles.main}>
          <div className="flex justify-center items-center min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    );
  }

  // If user is authenticated, show a simple dashboard placeholder
  if (user) {
    return (
      <div className={styles.page}>
        <Navigation />
        <main className={styles.main}>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Healthcare Dashboard</h1>
            <p className="mb-4">Welcome, {user.email}</p>
            <p>Your healthcare dashboard is under construction.</p>
          </div>
        </main>
      </div>
    );
  }

  // This will only show briefly before the redirect happens
  return null;
}
