'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/components/icons/CustomIcons';
import styles from './DoctorProfileForm.module.css';
import { doctorService } from '@/lib/api';
import { ApiTypes } from '@/lib/api';

interface DoctorProfile {
  userId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  location: string;
  languages: string;
  yearsOfExperience: string;
  education: string;
  professionalBio: string;
  consultationFee: string;
  profilePicture: string;
}

const initialProfileState: DoctorProfile = {
  userId: '',
  firstName: '',
  lastName: '',
  specialty: '',
  location: '',
  languages: '',
  yearsOfExperience: '',
  education: '',
  professionalBio: '',
  consultationFee: '',
  profilePicture: '',
};

export default function DoctorProfileForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiTypes.DoctorProfile>({
    userId: '',
    firstName: '',
    lastName: '',
    specialty: '',
    location: '',
    languages: '',
    yearsOfExperience: '',
    education: '',
    professionalBio: '',
    consultationFee: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const doctorProfile = await doctorService.getProfileByUserId(user.uid);
        
        if (doctorProfile) {
          setProfile(doctorProfile);
          setError('');
        } else {
          // If no profile exists yet, initialize with user ID
          setProfile(prev => ({
            ...prev,
            userId: user.uid
          }));
          // This is not really an error, just information for a new user
          setError('');
        }
      } catch (err) {
        // Don't show errors related to missing profiles - these are expected for new users
        if (err instanceof Error && err.message.includes('404')) {
          console.log('No profile found, creating a new one');
          setProfile(prev => ({
            ...prev,
            userId: user.uid
          }));
          setError('');
        } else {
          console.error('Error fetching profile:', err);
          setError('Failed to load your profile. Please try again later.');
        }
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
      // Use the new createOrUpdateProfile method that handles API/Firebase fallback
      await doctorService.createOrUpdateProfile(user.uid, profile);
      
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
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>Doctor Profile Management</h1>
      
      <div className={styles.profileContent}>
        {/* Left Panel - Profile Picture */}
        <div className={styles.profilePicturePanel}>
          <h2 className={styles.panelTitle}>Profile Picture</h2>
          <div className={styles.profilePictureContainer}>
            {profile.profilePicture ? (
              <img 
                src={profile.profilePicture} 
                alt="Doctor Profile" 
                className={styles.profileImage} 
              />
            ) : (
              <div className={styles.defaultProfile}>
                <User size={80} />
                <p className={styles.defaultProfileText}>Default Profile</p>
                <p className={styles.doctorName}>
                  Dr. {profile.lastName || 'LastName'}
                </p>
                <p className={styles.doctorSpecialty}>
                  {profile.specialty || 'Specialty'}
                </p>
              </div>
            )}
            <div className={styles.profileNavigation}>
              <button className={styles.navButton}>Dashboard</button>
              <button className={styles.navButton}>Manage Availability</button>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Update Profile */}
        <div className={styles.updateProfilePanel}>
          <h2 className={styles.panelTitle}>Update Profile</h2>
          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="specialty" className={styles.label}>Specialty</label>
                <input
                  type="text"
                  id="specialty"
                  name="specialty"
                  value={profile.specialty}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Dermatology"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="location" className={styles.label}>Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Oran"
                  required
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="languages" className={styles.label}>Languages</label>
                <input
                  type="text"
                  id="languages"
                  name="languages"
                  value={profile.languages}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Arabic, English, Berber"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="yearsOfExperience" className={styles.label}>Years of Experience</label>
                <input
                  type="number"
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  value={profile.yearsOfExperience}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., 17"
                  required
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="education" className={styles.label}>Education</label>
              <input
                type="text"
                id="education"
                name="education"
                value={profile.education}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., Medical School 2, Graduated 1996"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="professionalBio" className={styles.label}>Professional Bio</label>
              <textarea
                id="professionalBio"
                name="professionalBio"
                value={profile.professionalBio}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="e.g., Experienced Dermatology specialist with a focus on patient care."
                rows={4}
                required
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="consultationFee" className={styles.label}>Consultation Fee</label>
                <input
                  type="text"
                  id="consultationFee"
                  name="consultationFee"
                  value={profile.consultationFee}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., $150"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="profilePicture" className={styles.label}>Profile Picture URL</label>
                <input
                  type="text"
                  id="profilePicture"
                  name="profilePicture"
                  value={profile.profilePicture}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
