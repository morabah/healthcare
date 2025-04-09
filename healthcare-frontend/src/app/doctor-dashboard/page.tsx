'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import Navigation from '@/components/Navigation';
import styles from './doctor-dashboard.module.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';

interface PatientSummary {
  id: string;
  name: string;
  email: string | null;
  lastVisit: string | null;
  upcomingAppointment: string | null;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user || userData?.role !== 'doctor') {
        return;
      }

      try {
        setIsLoading(true);
        // Get all users with role 'patient'
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'patient'));
        const querySnapshot = await getDocs(q);
        
        const patientsList: PatientSummary[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          patientsList.push({
            id: doc.id,
            name: userData.displayName || 'Unknown',
            email: userData.email || null,
            lastVisit: null, // This would come from appointments collection
            upcomingAppointment: null // This would come from appointments collection
          });
        });
        
        setPatients(patientsList);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [user, userData]);

  // Redirect if user is not a doctor
  useEffect(() => {
    if (userData && userData.role !== 'doctor') {
      router.push('/profile');
    }
  }, [userData, router]);

  const handleViewPatient = (patientId: string) => {
    router.push(`/patient/${patientId}`);
  };

  return (
    <ProtectedRoute>
      <div className={styles.dashboardPage}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h1 className={styles.title}>Doctor Dashboard</h1>
              <p className={styles.welcome}>Welcome, Dr. {userData?.displayName?.split(' ')[0]}</p>
            </div>

            <div className={styles.statsContainer}>
              <div className={styles.statCard}>
                <h3>Total Patients</h3>
                <p className={styles.statNumber}>{patients.length}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Today's Appointments</h3>
                <p className={styles.statNumber}>0</p>
              </div>
              <div className={styles.statCard}>
                <h3>Pending Reports</h3>
                <p className={styles.statNumber}>0</p>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>My Patients</h2>
                <button className={styles.addButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add Patient
                </button>
              </div>

              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading patients...</p>
                </div>
              ) : error ? (
                <div className={styles.errorContainer}>
                  <p>{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className={styles.retryButton}
                  >
                    Retry
                  </button>
                </div>
              ) : patients.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M9 17a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-10a6 6 0 1 0 0 12A6 6 0 0 0 9 7Zm10 4a3 3 0 0 1 2.83 4H18a1 1 0 0 0 0 2h4v-1a5 5 0 0 0-10 0v1h2a1 1 0 0 0 0-2h-1.17A3 3 0 0 1 19 11Z"/>
                  </svg>
                  <h3>No patients yet</h3>
                  <p>Start by adding your first patient</p>
                  <button className={styles.addButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add Patient
                  </button>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Last Visit</th>
                        <th>Next Appointment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr key={patient.id}>
                          <td>{patient.name}</td>
                          <td>{patient.email || 'N/A'}</td>
                          <td>{patient.lastVisit || 'No visits'}</td>
                          <td>{patient.upcomingAppointment || 'None scheduled'}</td>
                          <td>
                            <button 
                              onClick={() => handleViewPatient(patient.id)}
                              className={styles.actionButton}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h2>Upcoming Appointments</h2>
              <div className={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M19 4h-1V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7h16v7zm0-9H4V7a1 1 0 0 1 1-1h1v1a1 1 0 0 0 2 0V6h8v1a1 1 0 0 0 2 0V6h1a1 1 0 0 1 1 1v3z"/>
                </svg>
                <h3>No upcoming appointments</h3>
                <p>Schedule appointments with your patients</p>
                <button className={styles.addButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
