'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './ProfileForm.module.css';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';

interface PatientProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string;
  allergies: string;
  medications: string;
  bloodType: string;
}

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
  const [profile, setProfile] = useState<PatientProfile>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const profileRef = doc(db, 'patientProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as PatientProfile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const profileRef = doc(db, 'patientProfiles', user.uid);
      await setDoc(profileRef, profile, { merge: true });
      setSuccessMessage('Profile saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.label}>First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
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
              value={profile.lastName}
              onChange={handleChange}
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
              value={profile.dateOfBirth}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>Gender</label>
            <select
              id="gender"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
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
            value={profile.phoneNumber}
            onChange={handleChange}
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
            value={profile.address}
            onChange={handleChange}
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
              value={profile.city}
              onChange={handleChange}
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
              value={profile.state}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="zipCode" className={styles.label}>ZIP Code</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={profile.zipCode}
              onChange={handleChange}
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
            <label htmlFor="emergencyContactName" className={styles.label}>Name</label>
            <input
              type="text"
              id="emergencyContactName"
              name="emergencyContactName"
              value={profile.emergencyContactName}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="emergencyContactPhone" className={styles.label}>Phone Number</label>
            <input
              type="tel"
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              value={profile.emergencyContactPhone}
              onChange={handleChange}
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
            value={profile.medicalConditions}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="List any medical conditions you have"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="allergies" className={styles.label}>Allergies</label>
          <textarea
            id="allergies"
            name="allergies"
            value={profile.allergies}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="List any allergies you have"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="medications" className={styles.label}>Current Medications</label>
          <textarea
            id="medications"
            name="medications"
            value={profile.medications}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="List any medications you are currently taking"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="bloodType" className={styles.label}>Blood Type</label>
          <select
            id="bloodType"
            name="bloodType"
            value={profile.bloodType}
            onChange={handleChange}
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
      
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className={styles.successContainer}>
          <p className={styles.successText}>{successMessage}</p>
        </div>
      )}
      
      <div className={styles.formActions}>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className={styles.buttonSpinner}></span>
              Saving...
            </>
          ) : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
