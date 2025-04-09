'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createLogger } from '@/lib/logger';
import { getLogHistory, LogLevel, setLogLevel } from '@/lib/logger';

const authDebugLogger = createLogger('auth-debugger');

interface AuthDebuggerProps {
  isVisible?: boolean;
}

/**
 * Auth Debugger Component
 * 
 * A development-only component that shows detailed authentication state and logs
 * to help diagnose authentication issues.
 */
export default function AuthDebugger({ isVisible = true }: AuthDebuggerProps) {
  const { user, userData, isNewGoogleUser, pendingGoogleUserData } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Don't render in production
  if (process.env.NODE_ENV === 'production' && !isVisible) {
    return null;
  }

  // Refresh log entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogEntries(getLogHistory());
      setRefreshKey(prev => prev + 1);
    }, 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Set log level to DEBUG in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setLogLevel(LogLevel.DEBUG);
      authDebugLogger.debug('Auth debugger initialized');
    }
  }, []);

  // Display auth state and logs
  return (
    <div
      style={{
        position: 'fixed',
        bottom: expanded ? '0' : 'auto',
        right: '0',
        width: expanded ? '60%' : 'auto',
        maxWidth: '600px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        borderRadius: expanded ? '8px 0 0 0' : '4px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        maxHeight: expanded ? '80vh' : 'auto',
        overflow: expanded ? 'auto' : 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: expanded ? '10px' : '0',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <strong>Auth Debugger {user ? '🟢' : '🔴'}</strong>
        <span>{expanded ? '⬇️' : '⬆️'}</span>
      </div>

      {!expanded && (
        <div style={{ fontSize: '10px' }}>
          {user ? `Signed in: ${user.email}` : 'Not signed in'}
        </div>
      )}

      {expanded && (
        <>
          <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div><strong>Auth State</strong></div>
            <div>User: {user ? `${user.email} (${user.uid})` : 'Not signed in'}</div>
            <div>Provider: {user?.providerData[0]?.providerId || 'None'}</div>
            <div>Role: {user && userData?.role ? userData.role : 'No role'}</div>
            <div>New Google User: {isNewGoogleUser ? 'Yes' : 'No'}</div>
            <div>Pending Data: {pendingGoogleUserData ? 'Yes' : 'No'}</div>
            <div>Sign-in Status: {user ? '🟢 Signed In' : '🔴 Signed Out'}</div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Auth Logs</strong> <span>({logEntries.length})</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLogEntries(getLogHistory());
                setRefreshKey(prev => prev + 1);
              }}
              style={{
                marginLeft: '5px',
                background: 'none',
                border: '1px solid #fff',
                color: '#fff',
                padding: '2px 5px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>

          <div 
            style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '5px'
            }}
          >
            {logEntries
              .filter(entry => entry.module.includes('auth') || entry.module.includes('login'))
              .slice(-50)
              .reverse()
              .map((entry, idx) => {
                let color = '#fff';
                switch (entry.level) {
                  case LogLevel.DEBUG: color = '#8ab7fb'; break;
                  case LogLevel.INFO: color = '#62dd62'; break;
                  case LogLevel.WARN: color = '#ddd84a'; break;
                  case LogLevel.ERROR: color = '#ff7575'; break;
                }
                
                return (
                  <div key={`${idx}-${refreshKey}`} style={{ marginBottom: '5px', color }}>
                    <div style={{ opacity: 0.7 }}>
                      {entry.timestamp.split('T')[1].split('.')[0]} 
                      [{LogLevel[entry.level]}] 
                      [{entry.module}]
                    </div>
                    <div>{entry.message}</div>
                    {entry.data && (
                      <div style={{ color: '#aaa', paddingLeft: '10px' }}>
                        {typeof entry.data === 'object' 
                          ? JSON.stringify(entry.data, null, 0)
                          : entry.data}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
