'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfDay, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useDoctorAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/lib/api/types';
import { Calendar, Clock, ChevronLeft, ChevronRight } from '@/components/icons/CustomIcons';
import { AppointmentCalendarSkeleton } from '@/components/ui/skeleton';
import styles from './AppointmentsCalendar.module.css';

type CalendarView = 'day' | 'week';

interface AppointmentsCalendarProps {
  onAppointmentSelected?: (appointmentId: string) => void;
}

export default function AppointmentsCalendar({ onAppointmentSelected }: AppointmentsCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);
  
  // Get the first day of the week (for week view)
  const firstDayOfWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
  
  // Use our optimized appointment hook for fetching doctor's appointments
  const { 
    data: appointmentsData, 
    isLoading, 
    error, 
    isPending,
    refetch 
  } = useDoctorAppointments(
    user?.uid || '', 
    undefined, // Get all statuses
    1,
    100, // Get enough to cover likely appointments
    {
      enabled: !!user?.uid,
      staleTime: 300000, // 5 minutes (MEDIUM cache),
    }
  );
  
  // Filter appointments for the current view (day or week)
  const getFilteredAppointments = () => {
    if (!appointmentsData?.data) return [];
    
    return appointmentsData.data.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      
      if (view === 'day') {
        return isSameDay(appointmentDate, currentDate);
      } else {
        const endOfWeek = addDays(firstDayOfWeek, 6);
        return appointmentDate >= firstDayOfWeek && appointmentDate <= endOfWeek;
      }
    });
  };
  
  const appointments = getFilteredAppointments();
  
  // Navigation functions
  const goToNext = () => {
    if (view === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };
  
  const goToPrevious = () => {
    if (view === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Generate the dates for the weekly view
  const getDatesForWeekView = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(firstDayOfWeek, i));
    }
    return dates;
  };
  
  // Get the time slots for the day
  const getTimeSlots = () => {
    const slots = [];
    for (let i = 8; i <= 18; i++) { // 8 AM to 6 PM
      slots.push(`${i}:00`);
      if (i < 18) slots.push(`${i}:30`);
    }
    return slots;
  };
  
  // Format appointment for display
  const getAppointmentDisplay = (appointment: Appointment) => {
    const patientInfo = appointment.patientName || 'Patient';
    const timeInfo = `${appointment.startTime} - ${appointment.endTime}`;
    return `${patientInfo} (${timeInfo})`;
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
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };
  
  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentSelected && appointment.id) {
      onAppointmentSelected(appointment.id);
    }
  };

  if (isPending) {
    return (
      <div className={styles.calendarContainer}>
        <AppointmentCalendarSkeleton />
      </div>
    );
  }
  
  if (isLoading) {
    return <div className={styles.loading}>Loading appointments...</div>;
  }
  
  if (error) {
    return (
      <div className={styles.error}>
        <p>Error loading appointments</p>
        <button onClick={handleRefresh} className={styles.refreshButton}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarNav}>
          <button 
            onClick={goToPrevious} 
            className={styles.navButton}
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className={styles.currentDate}>
            {view === 'day' 
              ? format(currentDate, 'MMMM d, yyyy')
              : `${format(firstDayOfWeek, 'MMM d')} - ${format(addDays(firstDayOfWeek, 6), 'MMM d, yyyy')}`
            }
          </div>
          
          <button 
            onClick={goToNext} 
            className={styles.navButton}
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className={styles.calendarActions}>
          <button onClick={goToToday} className={styles.actionButton}>Today</button>
          <select 
            value={view} 
            onChange={(e) => setView(e.target.value as CalendarView)}
            className={styles.viewSelector}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
          </select>
        </div>
      </div>
      
      {view === 'day' ? (
        <div className={styles.dayView}>
          <div className={styles.timeSlots}>
            {getTimeSlots().map(slot => (
              <div key={slot} className={styles.timeSlot}>
                <div className={styles.timeLabel}>{slot}</div>
                <div className={styles.slotContent}>
                  {appointments
                    .filter(apt => apt.startTime === slot)
                    .map(appointment => (
                      <div 
                        key={appointment.id}
                        className={`${styles.appointment} ${getStatusClass(appointment.status)}`}
                        onMouseEnter={() => setHoveredAppointment(appointment)}
                        onMouseLeave={() => setHoveredAppointment(null)}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className={styles.appointmentTime}>
                          <Clock size={14} />
                          <span>{appointment.startTime} - {appointment.endTime}</span>
                        </div>
                        <div className={styles.appointmentPatient}>{appointment.patientName || 'Patient'}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.weekView}>
          <div className={styles.weekDays}>
            {getDatesForWeekView().map(date => (
              <div key={date.toString()} className={styles.weekDay}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayName}>{format(date, 'EEE')}</div>
                  <div className={styles.dayDate}>{format(date, 'd')}</div>
                </div>
                <div className={styles.dayAppointments}>
                  {appointments
                    .filter(apt => isSameDay(new Date(apt.date), date))
                    .map(appointment => (
                      <div 
                        key={appointment.id}
                        className={`${styles.appointment} ${getStatusClass(appointment.status)}`}
                        onMouseEnter={() => setHoveredAppointment(appointment)}
                        onMouseLeave={() => setHoveredAppointment(null)}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className={styles.appointmentTime}>
                          <Clock size={14} />
                          <span>{appointment.startTime} - {appointment.endTime}</span>
                        </div>
                        <div className={styles.appointmentPatient}>{appointment.patientName || 'Patient'}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {hoveredAppointment && (
        <div className={styles.appointmentTooltip}>
          <div className={styles.tooltipTitle}>Appointment Details</div>
          <div className={styles.tooltipContent}>
            <p><strong>Patient:</strong> {hoveredAppointment.patientName || 'No name'}</p>
            <p><strong>Date:</strong> {format(new Date(hoveredAppointment.date), 'MMMM d, yyyy')}</p>
            <p><strong>Time:</strong> {hoveredAppointment.startTime} - {hoveredAppointment.endTime}</p>
            <p><strong>Status:</strong> {hoveredAppointment.status}</p>
            {hoveredAppointment.notes && <p><strong>Notes:</strong> {hoveredAppointment.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
