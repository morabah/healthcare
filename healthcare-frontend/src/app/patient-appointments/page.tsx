'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import AppointmentsList from '@/components/patient/AppointmentsList';
import Link from 'next/link';
import styles from './patient-appointments.module.css';
import { createLogger } from '@/lib/logger';
import { Home } from '@/components/icons/CustomIcons';

// Create logger for patient appointments
const logger = createLogger('patient-appointments');

export default function PatientAppointmentsPage() {
  const { userData } = useAuth();
  const router = useRouter();

  // Handle role check
  useEffect(() => {
    if (userData && userData.role !== 'patient') {
      logger.warn('Non-patient trying to access patient appointments page, redirecting');
      router.push('/doctor-dashboard');
    }
  }, [userData, router]);

  return (
    <ProtectedRoute>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1>My Appointments</h1>
          <nav className={styles.nav}>
            <Link href="/patient-dashboard" className={styles.navLink}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </nav>
        </header>
        
        <main className={styles.content}>
          <AppointmentsList />
        </main>
      </div>
    </ProtectedRoute>
  );
}
