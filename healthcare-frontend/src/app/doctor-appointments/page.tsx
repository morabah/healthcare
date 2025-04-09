'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import AppointmentsCalendar from '@/components/doctor/AppointmentsCalendar';
import AppointmentDetails from '@/components/doctor/AppointmentDetails';
import { Home, Calendar } from '@/components/icons/CustomIcons';
import styles from './doctor-appointments.module.css';
import { createLogger } from '@/lib/logger';
import Link from 'next/link';

// Create logger for doctor appointments
const logger = createLogger('doctor-appointments');

export default function DoctorAppointmentsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Handle role check
  useEffect(() => {
    if (userData && userData.role !== 'doctor') {
      logger.warn('Non-doctor trying to access doctor appointments page, redirecting');
      router.push('/patient-dashboard');
    }
  }, [userData, router]);

  // Handle appointment selection
  const handleAppointmentSelected = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
  };

  // Handle close appointment details
  const handleCloseDetails = () => {
    setSelectedAppointmentId(null);
  };

  // Handle appointment update
  const handleAppointmentUpdated = () => {
    // Trigger any updates needed
    logger.info('Appointment updated');
  };

  return (
    <ProtectedRoute>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1>Doctor Appointments</h1>
          <nav className={styles.nav}>
            <Link href="/doctor-dashboard" className={styles.navLink}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </nav>
        </header>
        
        <main className={styles.content}>
          <div className={styles.calendarContainer}>
            <AppointmentsCalendar onAppointmentSelected={handleAppointmentSelected} />
          </div>
          
          {selectedAppointmentId && (
            <div className={styles.detailsContainer}>
              <AppointmentDetails 
                appointmentId={selectedAppointmentId}
                onClose={handleCloseDetails}
                onUpdated={handleAppointmentUpdated}
              />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
