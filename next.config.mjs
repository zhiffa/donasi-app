/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi untuk mengizinkan gambar dari domain eksternal
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // --- UNTUK SUPABASE ---
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Mengizinkan semua subdomain supabase
        port: '',
        pathname: '/**',
      },
    ],
  },

  // --- KONFIGURASI REDIRECT ---
  async redirects() {
    return [
      {
        // Menangkap URL lama: /program/123 atau /program/apa-saja
        source: '/program/:path*', 
        // Mengarahkan ke URL baru: /programs/123
        destination: '/programs/:path*', 
        // true = 308 Permanent Redirect (Bagus untuk SEO agar Google tahu link pindah selamanya)
        permanent: true, 
      },
    ];
  },
};

export default nextConfig;