'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import styles from './LoginForm.module.css';
import RoleSelector from './RoleSelector';

type FormMode = 'login' | 'signup' | 'reset';

export default function LoginForm() {
  const { user, error: authError, login, signUp, signInWithGoogle, resetPassword, setError: setAuthError } = useAuth();
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
      setError(authError);
    }
  }, [authError]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
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
    setError(null);
    setLoading(true);
    
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error is already set in the auth context
      // Check for specific error types
      if (err instanceof Error) {
        if (err.message.includes('popup-blocked') || err.message.includes('popup')) {
          setError("The authentication popup was blocked by your browser. Please allow popups for this site and try again.");
        } else if (err.message.includes('unauthorized-domain')) {
          setError("Google sign-in is not available on this domain. Please use email/password login instead, or contact the administrator to enable Google sign-in.");
        }
      }
    } finally {
      setLoading(false);
    }
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
          onClick={handleGoogleSignIn}
          className={styles.googleButton}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>
        
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
      </form>
    </div>
  );
}
