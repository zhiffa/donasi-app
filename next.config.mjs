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
        hostname: '**.supabase.co', // Mengizinkan semua subdomain supabase (misal: projectid.supabase.co)
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;