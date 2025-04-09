'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import styles from './LoginForm.module.css';
import RoleSelector from './RoleSelector';
import RoleSelectionModal from './RoleSelectionModal';
import { createLogger } from '@/lib/logger';

// Create a dedicated logger for login form
const loginLogger = createLogger('login-form');

type FormMode = 'login' | 'signup' | 'reset';

export default function LoginForm() {
  const { 
    user, 
    error: authError, 
    login, 
    signUp, 
    signInWithGoogle, 
    resetPassword, 
    setError: setAuthError,
    isNewGoogleUser,
    pendingGoogleUserData
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [mode, setMode] = useState<FormMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  // Handle auth context errors
  useEffect(() => {
    if (authError) {
      loginLogger.error('Authentication error received', { error: authError });
      setError(authError);
    }
  }, [authError]);

  // Clear errors when component unmounts
  useEffect(() => {
    loginLogger.debug('LoginForm component mounted');
    
    return () => {
      loginLogger.debug('LoginForm component unmounting, clearing errors');
      setAuthError(null);
    };
  }, [setAuthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (forgotPassword) {
      handlePasswordReset();
      return;
    }
    
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      
      if (password.length < 6) {
        setError("Password should be at least 6 characters");
        return;
      }
      
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password, name, role);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetSent(true);
      }
      if (mode !== 'reset') {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
      }
    } catch (err) {
      // Error is already set in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(email);
      setError(null);
      alert("Password reset email sent. Check your inbox.");
      setForgotPassword(false);
    } catch (err) {
      // Error is already set in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    loginLogger.info('Starting Google sign-in process from login form');
    setError(null);
    setLoading(true);
    
    try {
      // Clear the form fields when starting Google auth
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      loginLogger.debug('Form fields cleared, calling signInWithGoogle');
      
      // Track UI state for debugging
      if (isNewGoogleUser) {
        loginLogger.warn('isNewGoogleUser flag is already true before starting Google sign-in', {
          isNewGoogleUser
        });
      }
      
      // Call the Google sign-in function from AuthContext
      await signInWithGoogle();
      
      loginLogger.info('Google sign-in completed or waiting for role selection', {
        isNewGoogleUser: isNewGoogleUser
      });
      
      // Don't do anything else here - the redirect or role selection modal
      // will be handled by the AuthContext
    } catch (err) {
      loginLogger.error('Google sign-in error in LoginForm', err instanceof Error ? {
        message: err.message,
        name: err.name,
        stack: err.stack
      } : err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during Google sign-in.');
      }
    } finally {
      // Log the final state of the login process
      loginLogger.debug('Google sign-in process in LoginForm complete', {
        isLoading: loading,
        hasError: !!error,
        isNewGoogleUser: isNewGoogleUser
      });
      
      setLoading(false);
    }
  };

  const handleRoleSelectionComplete = () => {
    // This will be called after role selection is complete
    loginLogger.info('Role selection completed, user should be redirected shortly');
    
    // No need to do anything here, the AuthContext will handle the redirect
    // once the user data is fully set up
  };

  const toggleMode = (newMode: FormMode) => {
    setMode(newMode);
    setError(null);
    setResetSent(false);
    setForgotPassword(false);
  };

  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setError(null);
  };

  // Render role selection modal with improved error handling
  useEffect(() => {
    if (isNewGoogleUser) {
      loginLogger.info('Showing role selection modal', { 
        hasPendingData: !!pendingGoogleUserData 
      });
    }
  }, [isNewGoogleUser, pendingGoogleUserData]);

  // Password reset form
  if (mode === 'reset') {
    return (
      <div className={styles.formContainer}>
        <button 
          onClick={() => toggleMode('login')} 
          className={styles.backButton}
        >
          ← Back to Login
        </button>
        
        <h2 className={styles.formTitle}>Reset Password</h2>
        
        {resetSent ? (
          <div className={styles.successContainer}>
            <p className={styles.successText}>
              Password reset email sent! Check your inbox for further instructions.
            </p>
            <button 
              onClick={() => toggleMode('login')} 
              className={styles.submitButton}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.errorContainer}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner}></span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Login/Signup form
  return (
    <div className={styles.formContainer}>
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
          onClick={() => toggleMode('login')}
          type="button"
        >
          Log In
        </button>
        <button 
          className={`${styles.tab} ${mode === 'signup' ? styles.activeTab : ''}`}
          onClick={() => toggleMode('signup')}
          type="button"
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {mode === 'signup' && (
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        {!forgotPassword && (
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
        )}
        
        {mode === 'signup' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            
            <RoleSelector selectedRole={role} onRoleChange={setRole} />
          </>
        )}

        {mode === 'login' && !forgotPassword && (
          <button
            type="button"
            onClick={() => toggleMode('reset')}
            className={styles.forgotPasswordLink}
          >
            Forgot password?
          </button>
        )}

        {mode === 'login' && (
          <button
            type="button"
            onClick={toggleForgotPassword}
            className={styles.forgotPasswordLink}
          >
            Forgot password?
          </button>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner}></span>
          ) : (
            mode === 'login' ? 'Log In' : 'Sign Up'
          )}
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button 
          type="button" 
          className={styles.googleButton}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v3.2h5.59c-0.5,2.6-2.6,4.43-5.59,4.43c-3.3,0-6.01-2.7-6.01-6s2.7-6,6.01-6c1.49,0,2.85,0.55,3.9,1.45 l2.46-2.46C16.55,3.89,14.4,3,12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c5.2,0,8.65-3.73,8.65-8.9c0-0.57-0.05-1.12-0.15-1.65L21.35,11.1z" fill="#4285F4"></path>
            </g>
          </svg>
          <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>
        
        {/* Show role selection modal for new Google users */}
        {isNewGoogleUser && (
          <div className={styles.modalContainer}>
            <RoleSelectionModal onComplete={handleRoleSelectionComplete} />
          </div>
        )}
        
        <p className={styles.toggleText}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={() => toggleMode(mode === 'login' ? 'signup' : 'login')}
            className={styles.toggleButton}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
        
        {/* Debug info visible only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ position: 'fixed', bottom: 0, right: 0, background: '#f0f0f0', padding: '5px', fontSize: '10px', opacity: 0.7 }}>
            <div>Auth State: {user ? 'Signed In' : 'Signed Out'}</div>
            <div>New Google User: {isNewGoogleUser ? 'Yes' : 'No'}</div>
            <div>Has Pending Data: {pendingGoogleUserData ? 'Yes' : 'No'}</div>
          </div>
        )}
      </form>
    </div>
  );
}
