'use client';

import React, { useState } from 'react';
import { UserRole, useAuth } from '@/context/AuthContext';
import styles from './RoleSelectionModal.module.css';

interface RoleSelectionModalProps {
  onComplete: () => void;
}

export default function RoleSelectionModal({ onComplete }: RoleSelectionModalProps) {
  const { pendingGoogleUserData, completeGoogleSignIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get user display name or email for greeting
  const getUserIdentifier = () => {
    if (!pendingGoogleUserData) return 'there';
    return pendingGoogleUserData.displayName || pendingGoogleUserData.email || 'there';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await completeGoogleSignIn(selectedRole);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during role selection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Welcome to Healthcare App!</h2>
        <p className={styles.subtitle}>Hi {getUserIdentifier()}, we need a little more information to get you set up.</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.roleOptions}>
            <div className={styles.roleCard}>
              <input 
                type="radio" 
                id="patient-role" 
                name="role" 
                value="patient"
                checked={selectedRole === 'patient'}
                onChange={() => setSelectedRole('patient')}
                className={styles.radioInput}
              />
              <label htmlFor="patient-role" className={styles.roleLabel}>
                <div className={styles.roleHeader}>
                  <span className={styles.roleIcon}>👤</span>
                  <span className={styles.roleName}>Patient</span>
                </div>
                <p className={styles.roleDescription}>
                  I want to book appointments with doctors and manage my health information.
                </p>
              </label>
            </div>
            
            <div className={styles.roleCard}>
              <input 
                type="radio" 
                id="doctor-role" 
                name="role" 
                value="doctor"
                checked={selectedRole === 'doctor'}
                onChange={() => setSelectedRole('doctor')}
                className={styles.radioInput}
              />
              <label htmlFor="doctor-role" className={styles.roleLabel}>
                <div className={styles.roleHeader}>
                  <span className={styles.roleIcon}>👨‍⚕️</span>
                  <span className={styles.roleName}>Doctor</span>
                </div>
                <p className={styles.roleDescription}>
                  I am a healthcare professional and want to manage my appointments with patients.
                </p>
              </label>
            </div>
          </div>
          
          <div className={styles.buttonContainer}>
            <button 
              type="submit" 
              className={styles.continueButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up your account...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
