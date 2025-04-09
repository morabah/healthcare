'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';
import styles from './doctor-dashboard.module.css';
import { createLogger } from '@/lib/logger';

// Create logger for doctor dashboard
const doctorDashboardLogger = createLogger('doctor-dashboard');

interface PatientSummary {
  id: string;
  name: string;
  email: string;
  lastVisit?: string;
  upcomingAppointment?: string;
}

export default function DoctorDashboard() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'patient')
        );
        const querySnapshot = await getDocs(q);
        const patientData: PatientSummary[] = [];
        querySnapshot.forEach((doc) => {
          patientData.push({
            id: doc.id,
            ...doc.data()
          } as PatientSummary);
        });
        setPatients(patientData);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch patients');
        setIsLoading(false);
      }
    };

    if (userData?.role !== 'doctor') {
      router.push('/');
    } else {
      fetchPatients();
    }
  }, [userData, router]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>{error}</h2>
        <button 
          className={styles.errorButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const lastName = userData?.displayName?.split(' ')[1] || 'LastName2';

  return (
    <ProtectedRoute>
      <div className={styles.dashboardContainer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/doctor-dashboard" className={styles.logoContainer}>
              <Image 
                src="/logo.svg" 
                alt="Healthcare Logo" 
                width={40} 
                height={40} 
                priority 
              />
              <span className={styles.logoText}>Healthcare</span>
            </Link>
            <nav className={styles.mainNav}>
              <Link href="/doctor-dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/doctor-profile" className={styles.navLink}>Profile</Link>
              <Link href="/doctor-appointments" className={styles.navLink}>Appointments</Link>
              <Link href="/doctor-records" className={styles.navLink}>Medical Records</Link>
            </nav>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userEmail}>{user?.email}</span>
            <button 
              onClick={async () => {
                // Handle logout
                try {
                  doctorDashboardLogger.info('Doctor logging out');
                  await logout();
                  doctorDashboardLogger.info('Logout successful, redirecting to login page');
                  router.push('/login?signedOut=true');
                } catch (error) {
                  doctorDashboardLogger.error('Error during logout', error);
                  alert('There was an error logging out. Please try again.');
                }
              }} 
              className={styles.logoutButton}
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <h1 className={styles.welcomeTitle}>Welcome, Dr. {lastName}!</h1>
            <p className={styles.welcomeSubtitle}>
              Manage your appointments and patient information from your professional dashboard.
            </p>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {/* Today's Appointments */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Today's Appointments</h2>
                <p className={styles.statCardValue}>0</p>
                <Link href="/doctor-schedule" className={styles.statCardButton}>
                  View Schedule
                </Link>
              </div>
              <div className={styles.statCardIcon}>
                📅
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Upcoming Appointments</h2>
                <p className={styles.statCardValue}>3</p>
                <Link href="/doctor-appointments" className={styles.statCardButton}>
                  View Appointments
                </Link>
              </div>
              <div className={styles.statCardIcon}>
                📆
              </div>
            </div>

            {/* Notifications */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Notifications</h2>
                <p className={styles.statCardValue}>2</p>
                <Link href="/doctor-notifications" className={styles.statCardButton}>
                  View Notifications
                </Link>
              </div>
              <div className={styles.statCardIcon}>
                🔔
              </div>
            </div>

            {/* Profile Management */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Profile Management</h2>
                <p className={styles.statCardValue}>
                  👨‍⚕️
                </p>
                <Link href="/doctor-profile" className={styles.statCardButton}>
                  Manage Profile
                </Link>
              </div>
              <div className={styles.statCardIcon}>
                👨‍⚕️
              </div>
            </div>
          </div>

          {/* Quick Actions and Today's Schedule */}
          <div className={styles.panelsGrid}>
            {/* Quick Actions */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Quick Actions</h2>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.quickActionItem} onClick={() => router.push('/doctor-profile')}>
                  <div className={styles.quickActionContent}>
                    👨‍⚕️
                    <div className={styles.quickActionText}>
                      <h3 className={styles.quickActionTitle}>Update Profile</h3>
                      <p className={styles.quickActionDescription}>Update your professional information</p>
                    </div>
                  </div>
                  ➡️
                </div>
                
                <div className={styles.quickActionItem} onClick={() => router.push('/doctor-availability')}>
                  <div className={styles.quickActionContent}>
                    🕒️
                    <div className={styles.quickActionText}>
                      <h3 className={styles.quickActionTitle}>Manage Availability</h3>
                      <p className={styles.quickActionDescription}>Set your consultation hours</p>
                    </div>
                  </div>
                  ➡️
                </div>
                
                <div className={styles.quickActionItem} onClick={() => router.push('/doctor-appointments')}>
                  <div className={styles.quickActionContent}>
                    📅
                    <div className={styles.quickActionText}>
                      <h3 className={styles.quickActionTitle}>Manage Appointments</h3>
                      <p className={styles.quickActionDescription}>View and manage your appointments</p>
                    </div>
                  </div>
                  ➡️
                </div>
                
                <div className={styles.quickActionItem} onClick={() => router.push('/doctor-notifications')}>
                  <div className={styles.quickActionContent}>
                    🔔
                    <div className={styles.quickActionText}>
                      <h3 className={styles.quickActionTitle}>View Notifications</h3>
                      <p className={styles.quickActionDescription}>Check your latest notifications</p>
                    </div>
                  </div>
                  ➡️
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Today's Schedule</h2>
              </div>
              <div className={styles.scheduleContent}>
                📅
                <h3 className={styles.scheduleTitle}>No appointments scheduled for today</h3>
                <p className={styles.scheduleDescription}>Your daily appointments will appear here.</p>
                <Link href="/doctor-schedule" className={styles.scheduleButton}>
                  Manage Schedule
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
