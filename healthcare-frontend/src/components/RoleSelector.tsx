'use client';

import React from 'react';
import { UserRole } from '@/context/AuthContext';
import styles from './RoleSelector.module.css';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className={styles.roleSelector}>
      <h3 className={styles.roleTitle}>I am a:</h3>
      <div className={styles.roleOptions}>
        <div 
          className={`${styles.roleCard} ${selectedRole === 'patient' ? styles.selected : ''}`}
          onClick={() => onRoleChange('patient')}
        >
          <div className={styles.roleIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM9 4H11V9L10 8.25L9 9V4ZM18 20H6V4H7V13L10 10.75L13 13V4H18V20Z" />
            </svg>
          </div>
          <h4>Patient</h4>
          <p>I need medical care and want to manage my health information</p>
        </div>
        
        <div 
          className={`${styles.roleCard} ${selectedRole === 'doctor' ? styles.selected : ''}`}
          onClick={() => onRoleChange('doctor')}
        >
          <div className={styles.roleIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M20 6H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V6H4C2.9 6 2 6.9 2 8V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V8C22 6.9 21.1 6 20 6ZM10 4H14V6H10V4ZM20 20H4V8H20V20Z" />
              <path d="M13 10H11V13H8V15H11V18H13V15H16V13H13V10Z" />
            </svg>
          </div>
          <h4>Doctor</h4>
          <p>I provide medical care and need to manage patient information</p>
        </div>
      </div>
    </div>
  );
}
