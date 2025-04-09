'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components';
import styles from './records.module.css';

export default function PatientRecordsPage() {
  const { user, userData } = useAuth();

  return (
    <ProtectedRoute>
      <div className={styles.recordsPage}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <h1 className={styles.title}>Medical Records</h1>
            <p className={styles.description}>
              View and manage your medical records and health information.
            </p>
            
            <div className={styles.recordsList}>
              <div className={styles.recordCard}>
                <div className={styles.recordHeader}>
                  <h3>Annual Physical Examination</h3>
                  <span className={styles.recordDate}>April 15, 2024</span>
                </div>
                <div className={styles.recordContent}>
                  <p>Complete physical examination with Dr. Smith. Blood work, vitals, and general health assessment.</p>
                </div>
                <div className={styles.recordActions}>
                  <button className={styles.viewButton}>View Details</button>
                  <button className={styles.downloadButton}>Download PDF</button>
                </div>
              </div>
              
              <div className={styles.recordCard}>
                <div className={styles.recordHeader}>
                  <h3>COVID-19 Vaccination</h3>
                  <span className={styles.recordDate}>January 10, 2024</span>
                </div>
                <div className={styles.recordContent}>
                  <p>COVID-19 booster shot administered. Vaccine type: Moderna.</p>
                </div>
                <div className={styles.recordActions}>
                  <button className={styles.viewButton}>View Details</button>
                  <button className={styles.downloadButton}>Download PDF</button>
                </div>
              </div>
              
              <div className={styles.recordCard}>
                <div className={styles.recordHeader}>
                  <h3>Dental Checkup</h3>
                  <span className={styles.recordDate}>February 22, 2024</span>
                </div>
                <div className={styles.recordContent}>
                  <p>Regular dental checkup with Dr. Johnson. Cleaning and X-rays performed.</p>
                </div>
                <div className={styles.recordActions}>
                  <button className={styles.viewButton}>View Details</button>
                  <button className={styles.downloadButton}>Download PDF</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
