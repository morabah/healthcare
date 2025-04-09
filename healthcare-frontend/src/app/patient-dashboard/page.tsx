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

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  doctorId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
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

export default function PatientDashboard() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'medications' | 'metrics'>('overview');

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
              status: data.status,
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
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load your health information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [user]);

  const renderHealthSummary = () => {
    if (healthMetrics.length === 0) {
      return (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zm0 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm0-3.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          </svg>
          <p>No health metrics recorded yet</p>
        </div>
      );
    }

    // Group metrics by type
    const metricsByType: Record<string, HealthMetric[]> = {};
    healthMetrics.forEach(metric => {
      if (!metricsByType[metric.type]) {
        metricsByType[metric.type] = [];
      }
      metricsByType[metric.type].push(metric);
    });

    return (
      <div className={styles.metricsGrid}>
        {Object.entries(metricsByType).map(([type, metrics]) => {
          const latestMetric = metrics[0]; // Metrics are already ordered by date desc
          return (
            <div key={type} className={styles.metricCard}>
              <h3>{type}</h3>
              <div className={styles.metricValue}>
                {latestMetric.value} <span className={styles.metricUnit}>{latestMetric.unit}</span>
              </div>
              <div className={styles.metricDate}>
                Last recorded: {new Date(latestMetric.date).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAppointments = () => {
    if (upcomingAppointments.length === 0) {
      return (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M19 4h-1V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-8 0c.83 0 1.5.67 1.5 1.5S11.83 6 11 6s-1.5-.67-1.5-1.5S10.17 3 11 3zm-1 5h2v7h-2V8zm0 11h2v-2h-2v2z"/>
          </svg>
          <p>No upcoming appointments</p>
          <button className={styles.actionButton}>Schedule Appointment</button>
        </div>
      );
    }

    return (
      <div className={styles.appointmentsList}>
        {upcomingAppointments.map(appointment => (
          <div key={appointment.id} className={styles.appointmentCard}>
            <div className={styles.appointmentDate}>
              <div className={styles.dateDay}>
                {new Date(appointment.date).getDate()}
              </div>
              <div className={styles.dateMonth}>
                {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
              </div>
            </div>
            <div className={styles.appointmentDetails}>
              <h3>{appointment.type}</h3>
              <p>Dr. {appointment.doctorName}</p>
              <p className={styles.appointmentTime}>{appointment.time}</p>
            </div>
            <div className={styles.appointmentStatus}>
              <span className={`${styles.statusBadge} ${styles[appointment.status]}`}>
                {appointment.status}
              </span>
            </div>
          </div>
        ))}
        <div className={styles.viewAllLink}>
          <Link href="/appointments">View all appointments</Link>
        </div>
      </div>
    );
  };

  const renderMedications = () => {
    if (medications.length === 0) {
      return (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M19.5 5.5l-9 9-4-4-4.5 4.5 4 4 9-9 4-4-4-4-9 9"/>
          </svg>
          <p>No active medications</p>
        </div>
      );
    }

    return (
      <div className={styles.medicationsList}>
        {medications.map(medication => (
          <div key={medication.id} className={styles.medicationCard}>
            <div className={styles.medicationIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19 3h-4.18C14.25 1.28 12.77 0 11 0S7.75 1.28 7.18 3H3C1.9 3 1 3.9 1 5v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 0c.83 0 1.5.67 1.5 1.5S11.83 6 11 6s-1.5-.67-1.5-1.5S10.17 3 11 3zm-1 5h2v7h-2V8zm0 11h2v-2h-2v2z"/>
              </svg>
            </div>
            <div className={styles.medicationDetails}>
              <h3>{medication.name}</h3>
              <p>{medication.dosage} - {medication.frequency}</p>
              <p className={styles.medicationPrescriber}>Prescribed by: Dr. {medication.prescribedBy}</p>
            </div>
            <div className={styles.medicationInstructions}>
              {medication.instructions}
            </div>
          </div>
        ))}
        <div className={styles.viewAllLink}>
          <Link href="/medications">View all medications</Link>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className={styles.dashboardSection}>
              <div className={styles.sectionHeader}>
                <h2>Upcoming Appointments</h2>
                <button className={styles.actionButton}>Schedule New</button>
              </div>
              {renderAppointments()}
            </div>
            
            <div className={styles.dashboardSection}>
              <div className={styles.sectionHeader}>
                <h2>Current Medications</h2>
              </div>
              {renderMedications()}
            </div>
            
            <div className={styles.dashboardSection}>
              <div className={styles.sectionHeader}>
                <h2>Health Metrics</h2>
                <button className={styles.actionButton}>Record New</button>
              </div>
              {renderHealthSummary()}
            </div>
          </>
        );
      case 'appointments':
        return (
          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2>Appointments</h2>
              <button className={styles.actionButton}>Schedule New</button>
            </div>
            {renderAppointments()}
          </div>
        );
      case 'medications':
        return (
          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2>Medications</h2>
            </div>
            {renderMedications()}
          </div>
        );
      case 'metrics':
        return (
          <div className={styles.dashboardSection}>
            <div className={styles.sectionHeader}>
              <h2>Health Metrics</h2>
              <button className={styles.actionButton}>Record New</button>
            </div>
            {renderHealthSummary()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRole="patient">
      <div className={styles.dashboardPage}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>Patient Dashboard</h1>
                <p className={styles.welcome}>Welcome, {userData?.displayName?.split(' ')[0]}</p>
              </div>
              <div className={styles.quickActions}>
                <button className={styles.actionButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M19 4h-1V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/>
                  </svg>
                  Book Appointment
                </button>
                <Link href="/profile" className={styles.profileLink}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  My Profile
                </Link>
              </div>
            </div>

            <div className={styles.tabs}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'appointments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                Appointments
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'medications' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('medications')}
              >
                Medications
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'metrics' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                Health Metrics
              </button>
            </div>

            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your health information...</p>
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
            ) : (
              renderTabContent()
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
