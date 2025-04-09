'use client'; // This component contains client-side logic (AuthProvider)

import React from 'react';
import { AuthProvider } from './AuthContext';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  // AuthProvider handles auth state and needs to be client-side
  return <AuthProvider>{children}</AuthProvider>;
}
