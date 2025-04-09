'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components';
import styles from './doctor-records.module.css';

interface PatientRecord {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  title: string;
  description: string;
}

export default function DoctorRecordsPage() {
  const { user, userData } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  // Sample data for demonstration
  const patientRecords: PatientRecord[] = [
    {
      id: '1',
      patientName: 'John Smith',
      patientId: 'patient-001',
      date: 'April 15, 2024',
      title: 'Annual Physical Examination',
      description: 'Complete physical examination. Blood work, vitals, and general health assessment.'
    },
    {
      id: '2',
      patientName: 'Sarah Johnson',
      patientId: 'patient-002',
      date: 'April 12, 2024',
      title: 'Follow-up Consultation',
      description: 'Follow-up for previous treatment. Patient reports improvement in symptoms.'
    },
    {
      id: '3',
      patientName: 'Michael Brown',
      patientId: 'patient-003',
      date: 'April 10, 2024',
      title: 'Prescription Renewal',
      description: 'Renewal of medication for chronic condition. No changes to dosage.'
    },
    {
      id: '4',
      patientName: 'Emily Davis',
      patientId: 'patient-004',
      date: 'April 8, 2024',
      title: 'Pre-Surgery Consultation',
      description: 'Pre-operative assessment for upcoming procedure. All tests within normal range.'
    },
    {
      id: '5',
      patientName: 'John Smith',
      patientId: 'patient-001',
      date: 'March 15, 2024',
      title: 'Respiratory Infection',
      description: 'Patient presented with symptoms of upper respiratory infection. Prescribed antibiotics.'
    }
  ];

  const patients = Array.from(new Set(patientRecords.map(record => record.patientId)))
    .map(patientId => {
      const record = patientRecords.find(r => r.patientId === patientId);
      return {
        id: patientId,
        name: record?.patientName || ''
      };
    });

  const filteredRecords = selectedPatient 
    ? patientRecords.filter(record => record.patientId === selectedPatient) 
    : patientRecords;

  return (
    <ProtectedRoute>
      <div className={styles.recordsPage}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.container}>
            <h1 className={styles.title}>Patient Medical Records</h1>
            <p className={styles.description}>
              View and manage medical records for your patients.
            </p>
            
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label htmlFor="patientFilter">Filter by Patient:</label>
                <select 
                  id="patientFilter" 
                  className={styles.filterSelect}
                  value={selectedPatient || ''}
                  onChange={(e) => setSelectedPatient(e.target.value || null)}
                >
                  <option value="">All Patients</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                  ))}
                </select>
              </div>
              <button className={styles.createRecordButton}>
                Create New Record
              </button>
            </div>

            <div className={styles.recordsList}>
              {filteredRecords.map(record => (
                <div key={record.id} className={styles.recordCard}>
                  <div className={styles.recordHeader}>
                    <h3>{record.title}</h3>
                    <span className={styles.recordDate}>{record.date}</span>
                  </div>
                  <div className={styles.patientInfo}>
                    <span className={styles.patientName}>Patient: {record.patientName}</span>
                  </div>
                  <div className={styles.recordContent}>
                    <p>{record.description}</p>
                  </div>
                  <div className={styles.recordActions}>
                    <button className={styles.viewButton}>View Details</button>
                    <button className={styles.editButton}>Edit Record</button>
                    <button className={styles.shareButton}>Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
