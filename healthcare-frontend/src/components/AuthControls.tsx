'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/firebaseClient';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

export default function AuthControls() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = (err: unknown, context: string): void => {
    console.error(`${context} error:`, err);
    if (err instanceof FirebaseError) {
      setError(err.message || `Failed during ${context.toLowerCase()}`);
    } else {
      setError(`An unexpected error occurred during ${context.toLowerCase()}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signed up:', userCredential.user.email);
      // Clear form
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      handleAuthError(err, 'Sign up');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in:', userCredential.user.email);
       // Clear form
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      handleAuthError(err, 'Login');
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await signOut(auth);
      console.log('Logged out');
    } catch (err: unknown) {
      handleAuthError(err, 'Logout');
    }
  };

  if (loading) {
    return <div>Loading auth status...</div>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '15px 0' }}>
      <h4>Authentication</h4>
      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      ) : (
        <form>
          <div>
            <label>Email: </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ margin: '5px' }} 
            />
          </div>
          <div>
            <label>Password: </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ margin: '5px' }} 
            />
          </div>
          <button type="submit" onClick={handleLogin} style={{ margin: '5px' }}>Log In</button>
          <button type="submit" onClick={handleSignUp} style={{ margin: '5px' }}>Sign Up</button>
        </form>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
