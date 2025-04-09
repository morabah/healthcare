import '@/app/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import ReactQueryClientProvider from '@/components/ReactQueryClientProvider';

// Optimize font loading with display swap
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif']
});

export const metadata: Metadata = {
  title: 'Healthcare Platform',
  description: 'Connecting patients with healthcare providers',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  metadataBase: new URL('https://healthcare-platform.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to domains for faster resource loading */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        
        {/* Add resource hints for key assets */}
        <link rel="preload" href="/static/images/logo.png" as="image" />
      </head>
      <body className={inter.className}>
        <ReactQueryClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
