'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sitemap.module.css';

interface SitemapNode {
  title: string;
  path: string;
  description: string;
  children?: SitemapNode[];
  requiredRole?: UserRole | 'any';
  icon?: string;
}

// Define user role type to match the auth context
type UserRole = 'patient' | 'doctor' | 'admin';

// Type guard for role check
function hasRole(role: string | undefined, targetRole: string): boolean {
  return role === targetRole;
}

// Type guard for 'any' role
function isAnyRole(role: string | undefined): role is 'any' {
  return role === 'any';
}

// Type guard for specific user roles
function isUserRole(role: string | undefined, targetRole: UserRole): boolean {
  return role === targetRole;
}

export default function Sitemap() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isDoctor = userData?.role === 'doctor';
  const isAdmin = isUserRole(userData?.role, 'admin');
  
  // Define the sitemap structure with role-based access
  const sitemapData = useMemo<SitemapNode[]>(() => [
    {
      title: 'Home',
      path: '/',
      description: 'Healthcare platform homepage with general information',
      icon: '🏠',
      requiredRole: 'any',
    },
    {
      title: 'Authentication',
      path: '/login',
      description: 'Login and registration',
      icon: '🔐',
      requiredRole: 'any',
      children: [
        {
          title: 'Login',
          path: '/login',
          description: 'Sign in to your account',
          icon: '🔑',
          requiredRole: 'any',
        },
        {
          title: 'Logout',
          path: '/logout',
          description: 'Sign out from your account',
          icon: '🚪',
          requiredRole: 'any',
        },
      ],
    },
    {
      title: 'Patient Area',
      path: '/patient-dashboard',
      description: 'Patient dashboard and features',
      icon: '👤',
      requiredRole: 'patient',
      children: [
        {
          title: 'Dashboard',
          path: '/patient-dashboard',
          description: 'Patient overview and summary',
          icon: '📊',
          requiredRole: 'patient',
        },
        {
          title: 'My Profile',
          path: '/profile',
          description: 'Manage your personal information',
          icon: '📝',
          requiredRole: 'patient',
        },
        {
          title: 'My Appointments',
          path: '/patient-appointments',
          description: 'View and manage your appointments',
          icon: '📅',
          requiredRole: 'patient',
        },
        {
          title: 'Medical Records',
          path: '/records',
          description: 'Access your medical records and history',
          icon: '📄',
          requiredRole: 'patient',
        },
      ],
    },
    {
      title: 'Doctor Area',
      path: '/doctor-dashboard',
      description: 'Doctor dashboard and features',
      icon: '👨‍⚕️',
      requiredRole: 'doctor',
      children: [
        {
          title: 'Dashboard',
          path: '/doctor-dashboard',
          description: 'Doctor overview and summary',
          icon: '📊',
          requiredRole: 'doctor',
        },
        {
          title: 'My Profile',
          path: '/doctor-profile',
          description: 'Manage your professional information',
          icon: '📝',
          requiredRole: 'doctor',
        },
        {
          title: 'Appointments',
          path: '/doctor-appointments',
          description: 'View and manage patient appointments',
          icon: '📅',
          requiredRole: 'doctor',
        },
        {
          title: 'Patient Records',
          path: '/doctor-records',
          description: 'Access patient medical records',
          icon: '📄',
          requiredRole: 'doctor',
        },
      ],
    },
  ], []);
  
  // Filter sitemap items based on user role
  const filteredSitemap = useMemo(() => {
    return sitemapData.filter(item => {
      if (isAnyRole(item.requiredRole)) return true;
      if (!user) return isAnyRole(item.requiredRole);
      if (item.requiredRole === 'patient') return isUserRole(userData?.role, 'patient');
      if (item.requiredRole === 'doctor') return isUserRole(userData?.role, 'doctor');
      if (item.requiredRole === 'admin') return isUserRole(userData?.role, 'admin');
      return false;
    });
  }, [sitemapData, user, userData]);
  
  // Render a sitemap node and its children
  const renderSitemapNode = (node: SitemapNode, level = 0) => {
    const isCurrentPath = pathname === node.path;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.path} className={`${styles.sitemapNode} ${level > 0 ? styles.childNode : ''}`}>
        <div 
          className={`${styles.nodeContent} ${isCurrentPath ? styles.activePath : ''}`}
          onClick={() => router.push(node.path)}
        >
          <span className={styles.nodeIcon}>{node.icon}</span>
          <div className={styles.nodeDetails}>
            <h3 className={styles.nodeTitle}>{node.title}</h3>
            <p className={styles.nodeDescription}>{node.description}</p>
          </div>
          <Link href={node.path} className={styles.nodeLink}>
            Visit
          </Link>
        </div>
        
        {hasChildren && (
          <div className={styles.nodeChildren}>
            {node.children!.filter(childNode => {
              if (isAnyRole(childNode.requiredRole)) return true;
              if (!user) return isAnyRole(childNode.requiredRole);
              if (childNode.requiredRole === 'patient') return isUserRole(userData?.role, 'patient');
              if (childNode.requiredRole === 'doctor') return isUserRole(userData?.role, 'doctor');
              if (childNode.requiredRole === 'admin') return isUserRole(userData?.role, 'admin');
              return false;
            }).map(childNode => renderSitemapNode(childNode, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={styles.sitemapContainer}>
      <h1 className={styles.sitemapTitle}>Healthcare Platform Sitemap</h1>
      <p className={styles.sitemapSubtitle}>
        Navigate through the available features and pages of our healthcare platform
      </p>
      
      <div className={styles.sitemapContent}>
        {filteredSitemap.map(node => renderSitemapNode(node))}
      </div>
    </div>
  );
}
