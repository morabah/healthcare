import React from 'react';
import styles from './skeleton.module.css';

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height = '20px',
  width = '100%',
  borderRadius = '4px'
}) => {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        height,
        width,
        borderRadius,
        backgroundColor: '#e2e8f0',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
};

export const AppointmentSkeleton: React.FC = () => {
  return (
    <div className={styles.appointmentSkeleton}>
      <div className={styles.appointmentSkeletonHeader}>
        <div className={styles.appointmentSkeletonInfo}>
          <Skeleton width={20} height={20} borderRadius="50%" />
          <Skeleton width={120} />
        </div>
        <Skeleton width={80} />
      </div>
      <Skeleton width="70%" height={16} />
      <div className={styles.appointmentSkeletonActions}>
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
};

export const AppointmentCalendarSkeleton: React.FC = () => {
  return (
    <div className={styles.appointmentCalendarSkeleton}>
      <div className={styles.calendarHeader}>
        <Skeleton width={120} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Skeleton width={80} height={32} />
          <Skeleton width={80} height={32} />
        </div>
      </div>
      
      <div className={styles.calendarDays} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {Array(7).fill(0).map((_, i) => (
          <Skeleton key={i} height={30} />
        ))}
      </div>
      
      <div className={styles.calendarTimeSlots} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={styles.timeSlot} style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width={80} height={40} />
            <Skeleton width="calc(100% - 88px)" height={40} />
          </div>
        ))}
      </div>
    </div>
  );
};
