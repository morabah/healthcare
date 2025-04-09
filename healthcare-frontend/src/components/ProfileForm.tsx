'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './ProfileForm.module.css';
import { usePatientProfile, useUpdatePatientProfile } from '@/hooks/useProfile';
import { PatientProfile } from '@/lib/api/services/profileService';
import { ProfileSkeleton } from './ProfileSkeleton';

const initialProfileState: PatientProfile = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalConditions: '',
  allergies: '',
  medications: '',
  bloodType: '',
};

export default function ProfileForm() {
  const { user } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query to fetch profile with optimized caching
  const { 
    data: profile = initialProfileState, 
    isLoading, 
    isError 
  } = usePatientProfile(user?.uid || '');
  
  // Use mutation hook with optimistic updates
  const { mutate: updateProfile, isPending: isSaving } = useUpdatePatientProfile();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // This is handled by the form directly now through controlled inputs
    // We don't need to maintain local state as React Query handles it
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Get all form values
    const formData = new FormData(e.currentTarget);
    const updatedProfile: PatientProfile = {
      firstName: formData.get('firstName') as string || '',
      lastName: formData.get('lastName') as string || '',
      dateOfBirth: formData.get('dateOfBirth') as string || '',
      gender: formData.get('gender') as string || '',
      phoneNumber: formData.get('phoneNumber') as string || '',
      address: formData.get('address') as string || '',
      city: formData.get('city') as string || '',
      state: formData.get('state') as string || '',
      zipCode: formData.get('zipCode') as string || '',
      emergencyContactName: formData.get('emergencyContactName') as string || '',
      emergencyContactPhone: formData.get('emergencyContactPhone') as string || '',
      medicalConditions: formData.get('medicalConditions') as string || '',
      allergies: formData.get('allergies') as string || '',
      medications: formData.get('medications') as string || '',
      bloodType: formData.get('bloodType') as string || '',
    };
    
    setError(null);
    setSuccessMessage(null);
    
    // Use the mutation hook which handles optimistic updates
    updateProfile(
      { 
        userId: user.uid, 
        profile: updatedProfile 
      },
      {
        onSuccess: () => {
          setSuccessMessage('Profile saved successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        },
        onError: (err) => {
          console.error('Error saving profile:', err);
          setError('Failed to save your profile. Please try again.');
        }
      }
    );
  };

  // Show skeleton while loading
  if (isLoading) {
    return <ProfileSkeleton />;
  }
  
  // Show error state
  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>
          Failed to load your profile. Please refresh the page to try again.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Success or error messages */}
      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}
      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.label}>First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              defaultValue={profile.firstName}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.label}>Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              defaultValue={profile.lastName}
              className={styles.input}
              required
            />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="dateOfBirth" className={styles.label}>Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              defaultValue={profile.dateOfBirth}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>Gender</label>
            <select
              id="gender"
              name="gender"
              defaultValue={profile.gender}
              className={styles.input}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber" className={styles.label}>Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            defaultValue={profile.phoneNumber}
            className={styles.input}
            required
          />
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Address</h2>
        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>Street Address</label>
          <input
            type="text"
            id="address"
            name="address"
            defaultValue={profile.address}
            className={styles.input}
            required
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="city" className={styles.label}>City</label>
            <input
              type="text"
              id="city"
              name="city"
              defaultValue={profile.city}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="state" className={styles.label}>State</label>
            <input
              type="text"
              id="state"
              name="state"
              defaultValue={profile.state}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="zipCode" className={styles.label}>Zip Code</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              defaultValue={profile.zipCode}
              className={styles.input}
              required
            />
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Emergency Contact</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="emergencyContactName" className={styles.label}>Emergency Contact Name</label>
            <input
              type="text"
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={profile.emergencyContactName}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="emergencyContactPhone" className={styles.label}>Emergency Contact Phone</label>
            <input
              type="tel"
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              defaultValue={profile.emergencyContactPhone}
              className={styles.input}
              required
            />
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Medical Information</h2>
        <div className={styles.formGroup}>
          <label htmlFor="medicalConditions" className={styles.label}>Medical Conditions</label>
          <textarea
            id="medicalConditions"
            name="medicalConditions"
            defaultValue={profile.medicalConditions}
            className={styles.textarea}
            rows={3}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="allergies" className={styles.label}>Allergies</label>
          <textarea
            id="allergies"
            name="allergies"
            defaultValue={profile.allergies}
            className={styles.textarea}
            rows={3}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="medications" className={styles.label}>Medications</label>
          <textarea
            id="medications"
            name="medications"
            defaultValue={profile.medications}
            className={styles.textarea}
            rows={3}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="bloodType" className={styles.label}>Blood Type</label>
          <select
            id="bloodType"
            name="bloodType"
            defaultValue={profile.bloodType}
            className={styles.input}
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>
      
      <div className={styles.formActions}>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
