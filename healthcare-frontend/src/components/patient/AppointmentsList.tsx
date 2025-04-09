'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isBefore, isEqual } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { usePatientAppointments, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { Appointment } from '@/lib/api/types';
import { Calendar, Clock, User, FileText, AlertCircle, Filter } from '@/components/icons/CustomIcons';
import Link from 'next/link';
import { AppointmentSkeleton } from '@/components/ui/skeleton';
import styles from './AppointmentsList.module.css';

type AppointmentStatus = 'all' | 'upcoming' | 'past' | 'cancelled';

export default function AppointmentsList() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<AppointmentStatus>('upcoming');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  // Use our optimized hook for fetching patient appointments
  const { 
    data: appointmentsData, 
    isLoading, 
    error, 
    refetch, 
    isPending 
  } = usePatientAppointments(
    user?.uid || '', 
    undefined, // Get all statuses and filter on client side for better UX
    1, 
    50, // Get enough appointments to cover all reasonable scenarios
    {
      enabled: !!user?.uid,
      staleTime: 300000, // 5 minutes (MEDIUM cache),
    }
  );
  
  // Mutation hook for appointment cancellation
  const { 
    mutate: cancelAppointment, 
    isPending: isCancelling 
  } = useUpdateAppointmentStatus();
  
  // Filter appointments on client-side for better UX
  const getFilteredAppointments = () => {
    if (!appointmentsData?.data) return [];
    
    const now = new Date();
    
    return appointmentsData.data.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const isPast = isBefore(appointmentDate, now) && !isEqual(
        new Date(appointmentDate).setHours(0, 0, 0, 0),
        new Date(now).setHours(0, 0, 0, 0)
      );
      
      switch(filter) {
        case 'upcoming':
          return !isPast && appointment.status === 'scheduled';
        case 'past':
          return (isPast || appointment.status === 'completed' || appointment.status === 'no-show');
        case 'cancelled':
          return appointment.status === 'cancelled';
        case 'all':
        default:
          return true;
      }
    });
  };
  
  const appointments = getFilteredAppointments();
  
  // Format appointment date
  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Handle appointment selection
  const handleViewDetails = (appointmentId: string | undefined) => {
    if (!appointmentId) return;
    
    // Toggle selection state with null safety
    setSelectedAppointmentId(prevId => 
      prevId === appointmentId ? null : appointmentId
    );
  };
  
  // Handle appointment cancellation with improved error handling
  const handleCancelAppointment = (appointmentId: string | undefined) => {
    if (!appointmentId) return;
    
    // Ask for confirmation before cancelling
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        cancelAppointment({ 
          appointmentId,
          status: 'cancelled' 
        }, {
          onSuccess: () => {
            // Show success message
            alert('Appointment cancelled successfully');
            // Refetch appointments to update UI
            refetch();
            // Clear selection if the cancelled appointment was selected
            if (selectedAppointmentId === appointmentId) {
              setSelectedAppointmentId(null);
            }
          },
          onError: (error) => {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
          }
        });
      } catch (error) {
        console.error('Unexpected error during appointment cancellation:', error);
        alert('An unexpected error occurred. Please try again later.');
      }
    }
  };
  
  // Get appointment status class
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'scheduled': return styles.scheduled;
      case 'completed': return styles.completed;
      case 'cancelled': return styles.cancelled;
      case 'no-show': return styles.noShow;
      default: return '';
    }
  };
  
  // Show skeleton loading state instead of just "Loading..."
  if (isPending) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>My Appointments</h2>
          <div className={styles.filterContainer}>
            <Filter size={16} />
            <select disabled className={styles.filter}>
              <option>Loading...</option>
            </select>
          </div>
        </div>
        
        <div className={styles.appointmentsList}>
          {Array(3).fill(0).map((_, index) => (
            <AppointmentSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return <div className={styles.loading}>Loading your appointments...</div>;
  }
  
  if (error) {
    return (
      <div className={styles.error}>
        <span style={{ fontSize: '24px' }}><AlertCircle /></span>
        <p>Error loading appointments</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Appointments</h2>
        <div className={styles.filterContainer}>
          <span><Filter /></span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as AppointmentStatus)}
            className={styles.filterSelect}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      
      {appointments.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <span style={{ fontSize: '48px' }}><Calendar /></span>
          </div>
          <h3 className={styles.emptyTitle}>No {filter} appointments found</h3>
          <p className={styles.emptyText}>
            {filter === 'upcoming' 
              ? 'You don\'t have any upcoming appointments scheduled. Book a new appointment to get started.'
              : `You don't have any ${filter} appointments.`
            }
          </p>
          <Link href="/book-appointment" className={styles.bookButton}>
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map(appointment => (
            <div key={appointment.id} className={styles.appointmentCard}>
              <div className={styles.appointmentHeader}>
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentDate}>
                    <span><Calendar /></span>
                    <span>{formatAppointmentDate(appointment.date)}</span>
                  </div>
                  <div className={styles.appointmentTime}>
                    <span><Clock /></span>
                    <span>{appointment.startTime} - {appointment.endTime}</span>
                  </div>
                </div>
                <div className={`${styles.status} ${getStatusClass(appointment.status)}`}>
                  {appointment.status}
                </div>
              </div>
              
              <div className={styles.doctorInfo}>
                <div className={styles.doctorAvatar}>
                  {appointment.doctorName?.charAt(0) || 'D'}
                </div>
                <div className={styles.doctorDetails}>
                  <h4 className={styles.doctorName}>{appointment.doctorName || 'Doctor'}</h4>
                  <div className={styles.appointmentType}>{appointment.type || 'General Checkup'}</div>
                </div>
              </div>
              
              <div className={styles.appointmentActions}>
                <button 
                  className={styles.detailsButton}
                  onClick={() => handleViewDetails(appointment.id)}
                >
                  {selectedAppointmentId === appointment.id ? 'Hide Details' : 'View Details'}
                </button>
                
                {appointment.status === 'scheduled' && (
                  <button 
                    className={styles.cancelButton}
                    onClick={() => handleCancelAppointment(appointment.id)}
                    disabled={isCancelling}
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              {selectedAppointmentId === appointment.id && (
                <div className={styles.detailsPanel}>
                  {appointment.notes && (
                    <div className={styles.noteSection}>
                      <h5 className={styles.sectionTitle}>Your Notes</h5>
                      <div className={styles.noteContent}>{appointment.notes}</div>
                    </div>
                  )}
                  
                  {appointment.status === 'completed' && appointment.medicalNotes && (
                    <div className={styles.medicalNotesSection}>
                      <h5 className={styles.sectionTitle}>Medical Notes</h5>
                      
                      {appointment.medicalNotes.diagnosis && (
                        <div className={styles.medicalNote}>
                          <div className={styles.noteLabel}>Diagnosis:</div>
                          <div className={styles.noteValue}>{appointment.medicalNotes.diagnosis}</div>
                        </div>
                      )}
                      
                      {appointment.medicalNotes.prescription && (
                        <div className={styles.medicalNote}>
                          <div className={styles.noteLabel}>Prescription:</div>
                          <div className={styles.noteValue}>{appointment.medicalNotes.prescription}</div>
                        </div>
                      )}
                      
                      {appointment.medicalNotes.followUpDate && (
                        <div className={styles.medicalNote}>
                          <div className={styles.noteLabel}>Follow-up Date:</div>
                          <div className={styles.noteValue}>{formatAppointmentDate(appointment.medicalNotes.followUpDate)}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {appointment.status === 'completed' && (
                    <Link href="/book-appointment" className={styles.followUpButton}>
                      Book Follow-up Appointment
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
