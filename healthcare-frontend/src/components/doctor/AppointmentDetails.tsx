'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useAppointment, useUpdateAppointmentStatus, useAddMedicalNotes } from '@/hooks/useAppointments';
import { Calendar, Clock, User, FileText, AlertCircle, X } from '@/components/icons/CustomIcons';
import styles from './AppointmentDetails.module.css';

interface AppointmentDetailsProps {
  appointmentId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AppointmentDetails({ 
  appointmentId, 
  onClose, 
  onUpdated 
}: AppointmentDetailsProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    followUpDate: ''
  });
  const [notesExpanded, setNotesExpanded] = useState(false);
  
  // Use our optimized React Query hooks
  const { 
    data: appointment, 
    isLoading, 
    error, 
    refetch 
  } = useAppointment(appointmentId);
  
  const { 
    mutate: updateStatus, 
    isPending: isUpdatingStatus 
  } = useUpdateAppointmentStatus();
  
  const { 
    mutate: addMedicalNotes, 
    isPending: isAddingNotes 
  } = useAddMedicalNotes();
  
  // Initialize notes from existing data if available
  useEffect(() => {
    if (appointment && appointment.medicalNotes) {
      setNotes({
        symptoms: appointment.medicalNotes.symptoms || '',
        diagnosis: appointment.medicalNotes.diagnosis || '',
        prescription: appointment.medicalNotes.prescription || '',
        followUpDate: appointment.medicalNotes.followUpDate || ''
      });
    }
  }, [appointment]);
  
  // Handle status update
  const handleStatusUpdate = (newStatus: 'scheduled' | 'completed' | 'cancelled' | 'no-show') => {
    updateStatus(
      { appointmentId, status: newStatus },
      {
        onSuccess: () => {
          refetch();
          onUpdated();
        }
      }
    );
  };
  
  // Handle notes update
  const handleSaveNotes = () => {
    // Filter out empty fields
    const notesToSave = Object.fromEntries(
      Object.entries(notes).filter(([_, value]) => value.trim() !== '')
    );
    
    if (Object.keys(notesToSave).length === 0) return;
    
    addMedicalNotes(
      { appointmentId, notes: notesToSave },
      {
        onSuccess: () => {
          refetch();
          onUpdated();
          setNotesExpanded(false);
        }
      }
    );
  };
  
  // Format appointment date
  const formatAppointmentDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Get status class
  const getStatusClass = (status?: string) => {
    switch(status) {
      case 'scheduled': return styles.scheduled;
      case 'completed': return styles.completed;
      case 'cancelled': return styles.cancelled;
      case 'no-show': return styles.noShow;
      default: return '';
    }
  };
  
  if (isLoading) {
    return <div className={styles.loading}>Loading appointment details...</div>;
  }
  
  if (error || !appointment) {
    return (
      <div className={styles.error}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <p>Error loading appointment details</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Appointment Details</h2>
        <div className={`${styles.status} ${getStatusClass(appointment.status)}`}>
          {appointment.status}
        </div>
      </div>
      
      <div className={styles.patientSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Patient Information</h3>
        </div>
        <div className={styles.patientInfo}>
          <div className={styles.infoCard}>
            <div className={styles.avatar}>
              {appointment.patientName?.charAt(0) || 'P'}
            </div>
            <div className={styles.patientDetails}>
              <h4 className={styles.patientName}>{appointment.patientName || 'Patient'}</h4>
              <div className={styles.detailRow}>
                <span>📅</span>
                <span>{formatAppointmentDate(appointment.date)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>🕒</span>
                <span>{appointment.startTime} - {appointment.endTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.appointmentSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Appointment Information</h3>
        </div>
        
        <div className={styles.appointmentInfo}>
          <div className={styles.infoGroup}>
            <label>Type</label>
            <div>{'General Checkup'}</div>
          </div>
          
          {appointment.notes && (
            <div className={styles.infoGroup}>
              <label>Patient Notes</label>
              <div className={styles.noteContent}>{appointment.notes}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Medical Notes Section */}
      <div className={styles.notesSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Medical Notes</h3>
          <button 
            className={styles.expandButton}
            onClick={() => setNotesExpanded(!notesExpanded)}
          >
            {notesExpanded ? 'Collapse' : 'Edit Notes'}
          </button>
        </div>
        
        {notesExpanded ? (
          <div className={styles.notesForm}>
            <div className={styles.formGroup}>
              <label htmlFor="symptoms">Symptoms</label>
              <textarea 
                id="symptoms"
                value={notes.symptoms}
                onChange={(e) => setNotes(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Enter patient symptoms"
                rows={3}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="diagnosis">Diagnosis</label>
              <textarea 
                id="diagnosis"
                value={notes.diagnosis}
                onChange={(e) => setNotes(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Enter diagnosis"
                rows={3}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="prescription">Prescription</label>
              <textarea 
                id="prescription"
                value={notes.prescription}
                onChange={(e) => setNotes(prev => ({ ...prev, prescription: e.target.value }))}
                placeholder="Enter prescription details"
                rows={3}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="followUp">Follow-up Date</label>
              <input 
                type="date"
                id="followUp"
                value={notes.followUpDate}
                onChange={(e) => setNotes(prev => ({ ...prev, followUpDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setNotesExpanded(false)}
                disabled={isAddingNotes}
              >
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveNotes}
                disabled={isAddingNotes}
              >
                {isAddingNotes ? 'Saving...' : 'Save Notes'}
                <span>💾</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.notesSummary}>
            {appointment.medicalNotes ? (
              <div className={styles.existingNotes}>
                {appointment.medicalNotes.symptoms && (
                  <div className={styles.noteItem}>
                    <span className={styles.noteLabel}>Symptoms:</span>
                    <span className={styles.noteValue}>{appointment.medicalNotes.symptoms}</span>
                  </div>
                )}
                
                {appointment.medicalNotes.diagnosis && (
                  <div className={styles.noteItem}>
                    <span className={styles.noteLabel}>Diagnosis:</span>
                    <span className={styles.noteValue}>{appointment.medicalNotes.diagnosis}</span>
                  </div>
                )}
                
                {appointment.medicalNotes.prescription && (
                  <div className={styles.noteItem}>
                    <span className={styles.noteLabel}>Prescription:</span>
                    <span className={styles.noteValue}>{appointment.medicalNotes.prescription}</span>
                  </div>
                )}
                
                {appointment.medicalNotes.followUpDate && (
                  <div className={styles.noteItem}>
                    <span className={styles.noteLabel}>Follow-up Date:</span>
                    <span className={styles.noteValue}>{formatAppointmentDate(appointment.medicalNotes.followUpDate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noNotes}>
                <span style={{ fontSize: '24px' }}>💬</span>
                <p>No medical notes have been added yet. Click "Edit Notes" to add them.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Status Actions */}
      {appointment.status === 'scheduled' && (
        <div className={styles.actionsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Appointment Actions</h3>
          </div>
          
          <div className={styles.statusActions}>
            <button 
              className={`${styles.statusButton} ${styles.completedButton}`}
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdatingStatus}
            >
              Mark as Completed
            </button>
            
            <button 
              className={`${styles.statusButton} ${styles.noShowButton}`}
              onClick={() => handleStatusUpdate('no-show')}
              disabled={isUpdatingStatus}
            >
              Mark as No-Show
            </button>
            
            <button 
              className={`${styles.statusButton} ${styles.cancelledButton}`}
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={isUpdatingStatus}
            >
              Cancel Appointment
            </button>
          </div>
        </div>
      )}
      
      <div className={styles.footer}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
