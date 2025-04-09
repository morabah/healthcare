'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components';
import Navigation from '@/components/Navigation';
import styles from './patient-dashboard.module.css';
import { collection, getDocs, query, where, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';
import Link from 'next/link';
import Image from 'next/image';

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  doctorId: string;
  status: 'pending' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  instructions?: string;
}

interface HealthMetric {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
}

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type: 'appointment' | 'medication' | 'result' | 'general';
}

export default function PatientDashboard() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);

  // Redirect if user is not a patient
  useEffect(() => {
    if (userData && userData.role !== 'patient') {
      router.push('/doctor-dashboard');
    }
  }, [userData, router]);

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Fetch upcoming appointments
        const appointmentsRef = collection(db, 'appointments');
        
        // Temporary solution until the composite index is built
        // Only filter by patientId and handle date filtering in JavaScript
        const appointmentsQuery = query(
          appointmentsRef,
          where('patientId', '==', user.uid)
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData: Appointment[] = [];
        
        const today = new Date().toISOString().split('T')[0];
        
        // Filter and sort in JavaScript instead of Firestore
        appointmentsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.date >= today) {
            appointmentsData.push({
              id: doc.id,
              date: data.date,
              time: data.time,
              doctorName: data.doctorName,
              doctorId: data.doctorId,
              status: data.status || 'pending',
              type: data.type,
              notes: data.notes
            });
          }
        });
        
        // Sort by date
        appointmentsData.sort((a, b) => a.date.localeCompare(b.date));
        
        // Limit to 5
        setUpcomingAppointments(appointmentsData.slice(0, 5));
        
        // Fetch medications
        const medicationsRef = collection(db, 'medications');
        const medicationsQuery = query(
          medicationsRef,
          where('patientId', '==', user.uid),
          where('active', '==', true)
        );
        
        const medicationsSnapshot = await getDocs(medicationsQuery);
        const medicationsData: Medication[] = [];
        
        medicationsSnapshot.forEach((doc) => {
          const data = doc.data();
          medicationsData.push({
            id: doc.id,
            name: data.name,
            dosage: data.dosage,
            frequency: data.frequency,
            startDate: data.startDate,
            endDate: data.endDate,
            prescribedBy: data.prescribedBy,
            instructions: data.instructions
          });
        });
        
        setMedications(medicationsData);
        
        // Fetch health metrics
        const metricsRef = collection(db, 'healthMetrics');
        const metricsQuery = query(
          metricsRef,
          where('patientId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(10)
        );
        
        const metricsSnapshot = await getDocs(metricsQuery);
        const metricsData: HealthMetric[] = [];
        
        metricsSnapshot.forEach((doc) => {
          const data = doc.data();
          metricsData.push({
            id: doc.id,
            type: data.type,
            value: data.value,
            unit: data.unit,
            date: data.date,
            notes: data.notes
          });
        });
        
        setHealthMetrics(metricsData);

        // Fetch patient profile
        const profileRef = doc(db, 'patientProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setPatientProfile(profileSnap.data());
        }

        // Mock notifications for now
        setNotifications([
          {
            id: '1',
            message: 'Your appointment with Dr. Smith is tomorrow',
            date: new Date().toISOString(),
            read: false,
            type: 'appointment'
          },
          {
            id: '2',
            message: 'New lab results available',
            date: new Date().toISOString(),
            read: false,
            type: 'result'
          },
          {
            id: '3',
            message: 'Medication refill reminder',
            date: new Date().toISOString(),
            read: false,
            type: 'medication'
          },
          {
            id: '4',
            message: 'Please complete your health survey',
            date: new Date().toISOString(),
            read: true,
            type: 'general'
          },
          {
            id: '5',
            message: 'Your prescription is ready for pickup',
            date: new Date().toISOString(),
            read: true,
            type: 'medication'
          }
        ]);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load your health information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString; // Already in the right format
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="patient">
        <div className={styles.dashboardPage}>
          <Navigation />
          <main className={styles.main}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading your health information...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="patient">
        <div className={styles.dashboardPage}>
          <Navigation />
          <main className={styles.main}>
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className={styles.dashboardPage}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            {/* Welcome Header */}
            <div className={styles.welcomeHeader}>
              <h1>Welcome, {userData?.displayName?.split(' ')[0] || 'Patient'}!</h1>
              <p>Manage your appointments and health information from your personal dashboard.</p>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryContent}>
                  <div>
                    <h3>Upcoming Appointments</h3>
                    <div className={styles.summaryNumber}>{upcomingAppointments.length}</div>
                  </div>
                  <div className={styles.summaryIcon} style={{ backgroundColor: '#1a73e8' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V2h-2v1H8V2H6v1H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                    </svg>
                  </div>
                </div>
                <Link href="/appointments" className={styles.viewAllLink}>View All</Link>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryContent}>
                  <div>
                    <h3>Medical Records</h3>
                    <div className={styles.summaryNumber}>{healthMetrics.length || 0}</div>
                  </div>
                  <div className={styles.summaryIcon} style={{ backgroundColor: '#34a853' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                  </div>
                </div>
                <Link href="/records" className={styles.viewAllLink}>View All</Link>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryContent}>
                  <div>
                    <h3>Prescriptions</h3>
                    <div className={styles.summaryNumber}>{medications.length}</div>
                  </div>
                  <div className={styles.summaryIcon} style={{ backgroundColor: '#00bcd4' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                </div>
                <Link href="/medications" className={styles.viewAllLink}>View All</Link>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryContent}>
                  <div>
                    <h3>Notifications</h3>
                    <div className={styles.summaryNumber}>{notifications.filter(n => !n.read).length}</div>
                  </div>
                  <div className={styles.summaryIcon} style={{ backgroundColor: '#ffa000' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                    </svg>
                  </div>
                </div>
                <Link href="/notifications" className={styles.viewAllLink}>View All</Link>
              </div>
            </div>

            <div className={styles.dashboardContent}>
              {/* Left Column - Appointments */}
              <div className={styles.appointmentsSection}>
                <div className={styles.sectionHeader}>
                  <h2>Upcoming Appointments</h2>
                </div>
                
                {upcomingAppointments.length > 0 ? (
                  <div className={styles.appointmentsTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Doctor</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingAppointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td>{formatDate(appointment.date)}</td>
                            <td>{formatTime(appointment.time)}</td>
                            <td>{appointment.doctorName}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[appointment.status]}`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td>
                              <button className={styles.actionButton}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No upcoming appointments</p>
                    <button className={styles.scheduleButton}>Schedule Appointment</button>
                  </div>
                )}
              </div>

              {/* Right Column - Profile Information */}
              <div className={styles.profileSection}>
                <div className={styles.sectionHeader}>
                  <h2>Profile Information</h2>
                </div>
                
                <div className={styles.profileContent}>
                  <div className={styles.profileAvatar}>
                    {userData?.photoURL ? (
                      <Image 
                        src={userData.photoURL} 
                        alt="Profile" 
                        width={80} 
                        height={80} 
                        className={styles.avatarImage} 
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.profileDetails}>
                    <div className={styles.profileRow}>
                      <span className={styles.profileLabel}>Name:</span>
                      <span className={styles.profileValue}>{userData?.displayName || 'Not provided'}</span>
                    </div>
                    <div className={styles.profileRow}>
                      <span className={styles.profileLabel}>Email:</span>
                      <span className={styles.profileValue}>{userData?.email || 'Not provided'}</span>
                    </div>
                    <div className={styles.profileRow}>
                      <span className={styles.profileLabel}>Phone:</span>
                      <span className={styles.profileValue}>{patientProfile?.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className={styles.profileRow}>
                      <span className={styles.profileLabel}>Date of Birth:</span>
                      <span className={styles.profileValue}>
                        {patientProfile?.dateOfBirth ? formatDate(patientProfile.dateOfBirth) : 'Not provided'}
                      </span>
                    </div>
                    <div className={styles.profileRow}>
                      <span className={styles.profileLabel}>Gender:</span>
                      <span className={styles.profileValue}>{patientProfile?.gender || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <Link href="/profile" className={styles.editProfileButton}>
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
