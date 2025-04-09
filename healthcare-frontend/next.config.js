/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile photos
      'firebasestorage.googleapis.com', // Firebase Storage
      'storage.googleapis.com' // Google Cloud Storage
    ],
  },
};

module.exports = nextConfig;
