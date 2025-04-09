import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import styles from './ProfileForm.module.css';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className={styles.form}>
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>
          <Skeleton width={180} height={24} />
        </h2>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <Skeleton width={100} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className={styles.formGroup}>
            <Skeleton width={100} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <Skeleton width={120} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className={styles.formGroup}>
            <Skeleton width={80} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <Skeleton width={120} height={20} />
          <Skeleton width="100%" height={40} />
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>
          <Skeleton width={100} height={24} />
        </h2>
        <div className={styles.formGroup}>
          <Skeleton width={140} height={20} />
          <Skeleton width="100%" height={40} />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <Skeleton width={60} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className={styles.formGroup}>
            <Skeleton width={80} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className={styles.formGroup}>
            <Skeleton width={100} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>
          <Skeleton width={180} height={24} />
        </h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <Skeleton width={200} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className={styles.formGroup}>
            <Skeleton width={220} height={20} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>
          <Skeleton width={150} height={24} />
        </h2>
        <div className={styles.formGroup}>
          <Skeleton width={180} height={20} />
          <Skeleton width="100%" height={60} />
        </div>
        <div className={styles.formGroup}>
          <Skeleton width={100} height={20} />
          <Skeleton width="100%" height={60} />
        </div>
        <div className={styles.formGroup}>
          <Skeleton width={130} height={20} />
          <Skeleton width="100%" height={60} />
        </div>
        <div className={styles.formGroup}>
          <Skeleton width={120} height={20} />
          <Skeleton width="100%" height={40} />
        </div>
      </div>
      
      <div className={styles.formActions}>
        <Skeleton width={120} height={40} />
      </div>
    </div>
  );
};
