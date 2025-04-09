'use client';

import React from 'react';
import { Sitemap } from '@/components';
import Navigation from '@/components/Navigation';
import styles from './sitemap.module.css';
import { useAuth } from '@/context/AuthContext';

export default function SitemapPage() {
  const { user } = useAuth();

  return (
    <div className={styles.sitemapPage}>
      <Navigation />
      <main className={styles.main}>
        <Sitemap />
      </main>
    </div>
  );
}
