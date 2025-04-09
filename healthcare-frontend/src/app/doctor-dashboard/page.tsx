'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import Navigation from '@/components/Navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';
import { Calendar, Bell, UserCircle, Clock, ChevronRight } from 'lucide-react';
import styles from './doctor-dashboard.module.css';
import {
  WelcomeTitle,
  WelcomeSubtitle,
  StatCardIcon,
  QuickActionItem,
  QuickActionContent,
  QuickActionText,
  QuickActionTitle,
  QuickActionDescription,
  ScheduleContent,
  ScheduleTitle,
  ScheduleDescription,
} from '@/styles/doctor-dashboard.styled';

interface PatientSummary {
  id: string;
  name: string;
  email: string;
  lastVisit?: string;
  upcomingAppointment?: string;
}

export default function DoctorDashboard() {
  const { user, userData } = useAuth();
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
        <div className={styles.navigationContainer}>
          <Navigation />
        </div>
        <div className={styles.contentContainer}>
          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <WelcomeTitle>
              Welcome, Dr. {lastName}!
            </WelcomeTitle>
            <WelcomeSubtitle>
              Manage your appointments and patient information from your professional dashboard.
            </WelcomeSubtitle>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {/* Today's Appointments */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Today's Appointments</h2>
                <p className={styles.statCardValue}>0</p>
                <button className={`${styles.statCardButton} ${styles.blueButton}`}>
                  View Schedule
                </button>
              </div>
              <StatCardIcon color="#3b82f6">
                <Calendar size={20} />
              </StatCardIcon>
            </div>

            {/* Upcoming Appointments */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Upcoming Appointments</h2>
                <p className={styles.statCardValue}>3</p>
                <button className={`${styles.statCardButton} ${styles.greenButton}`}>
                  View Appointments
                </button>
              </div>
              <StatCardIcon color="#10b981">
                <Calendar size={20} />
              </StatCardIcon>
            </div>

            {/* Notifications */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Notifications</h2>
                <p className={styles.statCardValue}>2</p>
                <button className={`${styles.statCardButton} ${styles.yellowButton}`}>
                  View Notifications
                </button>
              </div>
              <StatCardIcon color="#f59e0b">
                <Bell size={20} />
              </StatCardIcon>
            </div>

            {/* Profile Management */}
            <div className={styles.statCard}>
              <div className={styles.statCardContent}>
                <h2 className={styles.statCardTitle}>Profile Management</h2>
                <p className={styles.statCardValue}>
                  <UserCircle size={28} />
                </p>
                <button className={`${styles.statCardButton} ${styles.cyanButton}`}>
                  Manage Profile
                </button>
              </div>
              <StatCardIcon color="#06b6d4">
                <UserCircle size={20} />
              </StatCardIcon>
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
                <QuickActionItem>
                  <QuickActionContent>
                    <UserCircle className={styles.quickActionIcon} color="#3b82f6" size={18} />
                    <QuickActionText>
                      <QuickActionTitle>Update Profile</QuickActionTitle>
                      <QuickActionDescription>Update your professional information</QuickActionDescription>
                    </QuickActionText>
                  </QuickActionContent>
                  <ChevronRight size={18} color="#9ca3af" />
                </QuickActionItem>
                
                <QuickActionItem>
                  <QuickActionContent>
                    <Clock className={styles.quickActionIcon} color="#10b981" size={18} />
                    <QuickActionText>
                      <QuickActionTitle>Manage Availability</QuickActionTitle>
                      <QuickActionDescription>Set your consultation hours</QuickActionDescription>
                    </QuickActionText>
                  </QuickActionContent>
                  <ChevronRight size={18} color="#9ca3af" />
                </QuickActionItem>
                
                <QuickActionItem>
                  <QuickActionContent>
                    <Calendar className={styles.quickActionIcon} color="#3b82f6" size={18} />
                    <QuickActionText>
                      <QuickActionTitle>Manage Appointments</QuickActionTitle>
                      <QuickActionDescription>View and manage your appointments</QuickActionDescription>
                    </QuickActionText>
                  </QuickActionContent>
                  <ChevronRight size={18} color="#9ca3af" />
                </QuickActionItem>
                
                <QuickActionItem>
                  <QuickActionContent>
                    <Bell className={styles.quickActionIcon} color="#f59e0b" size={18} />
                    <QuickActionText>
                      <QuickActionTitle>View Notifications</QuickActionTitle>
                      <QuickActionDescription>Check your latest notifications</QuickActionDescription>
                    </QuickActionText>
                  </QuickActionContent>
                  <ChevronRight size={18} color="#9ca3af" />
                </QuickActionItem>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Today's Schedule</h2>
              </div>
              <ScheduleContent>
                <Calendar size={48} color="#9ca3af" className={styles.scheduleIcon} />
                <ScheduleTitle>No appointments scheduled for today</ScheduleTitle>
                <ScheduleDescription>Your daily appointments will appear here.</ScheduleDescription>
                <button className={styles.scheduleButton}>
                  Manage Schedule
                </button>
              </ScheduleContent>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
