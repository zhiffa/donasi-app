'use client' // Diperlukan untuk state dan hook

import { useState, useEffect } from 'react' // Impor useEffect
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation' // Impor router dan pathname
import { Menu, X, User, ChevronDown, LogOut } from 'lucide-react'

// Definisikan tipe User sederhana (sesuaikan jika perlu)
interface User {
  nama: string;
  role: 'admin' | 'donor';
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false) // State menu mobile
  const [isProfileOpen, setIsProfileOpen] = useState(false) // State dropdown profile
  
  // State untuk menyimpan status login dan data user
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();
  const pathname = usePathname(); // Untuk mendeteksi perubahan rute

  // 1. Cek status login saat komponen dimuat atau rute berubah
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me'); // Panggil API /api/auth/me
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        const data = await res.json();
        setUser(data.user);
        setAuthStatus('authenticated');
      } catch (error) {
        setAuthStatus('unauthenticated');
        setUser(null);
      }
    };

    fetchUser();
  }, [pathname]); // Jalankan ulang saat pindah halaman (misal: setelah login)

  // 2. Tutup semua menu saat pindah halaman
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // 3. Fungsi untuk menangani logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Apapun yang terjadi, update UI
      setUser(null);
      setAuthStatus('unauthenticated');
      setIsProfileOpen(false);
      router.push('/'); // Arahkan ke halaman utama
      router.refresh(); // Refresh untuk memastikan cookie session bersih
    }
  };

  // 4. Hapus 'Login' dari navLinks utama, kita akan tambahkan secara kondisional
  const navLinks = [
    { name: 'Donate', href: '/#donate' },
    { name: 'Programs', href: '/#programs' },
    { name: 'History', href: '/history' },
    { name: 'About', href: '/#about' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full h-23 bg-white shadow-sm">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
        {/* Kiri: Logo */}
        <Link href="/">
          <Image
            src="/logo.png" // Path ke gambar  di folder public
            alt="Logo Komunitas" 
            width={80} 
            height={1} 
            priority
          />
        </Link>

        {/* Kanan: Menu Navigasi (Desktop) */}
        <div className="hidden items-center space-x-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="font-medium text-gray-700 hover:text-pastel-pink-dark"
            >
              {link.name}
            </Link>
          ))}

          {/* === 5. Tombol Login / Profile Dropdown (Desktop) === */}
          <div className="relative">
            {authStatus === 'loading' && (
              // Tampilkan placeholder loading
              <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200"></div>
            )}
            
            {authStatus === 'unauthenticated' && (
              // Tampilkan tombol Login jika belum login
              <Link
                href="/login"
                className="font-medium text-gray-700 hover:text-pastel-pink-dark"
              >
                Login
              </Link>
            )}

            {authStatus === 'authenticated' && user && (
              // Tampilkan nama pengguna dan dropdown jika sudah login
              <div>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 rounded-full p-2 font-medium text-gray-700 hover:bg-gray-100"
                >
                  <User size={18} />
                  Hi, {user.nama.split(' ')[0]} {/* Ambil nama depan saja */}
                  <ChevronDown size={16} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {user.role === 'admin' && (
                       <Link
                        href="/admin"
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {/* Ganti dengan ikon dashboard jika mau */}
                        Dashboard Admin
                      </Link>
                    )}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Logout
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tombol Hamburger (Mobile) */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Menu Navigasi (Mobile) */}
      {isOpen && (
        <div className="absolute flex w-full flex-col space-y-4 bg-white px-4 pb-4 shadow-md md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-pastel-pink-dark"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {/* === 6. Tombol Login / Logout (Mobile) === */}
          <div className="border-t pt-4">
             {authStatus === 'loading' && (
               <div className="block rounded-md px-3 py-2 text-base font-medium text-gray-400">
                 Loading...
               </div>
             )}
             {authStatus === 'unauthenticated' && (
               <Link
                href="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-pastel-pink-dark"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
             )}
             {authStatus === 'authenticated' && user && (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-pastel-pink-dark"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard Admin
                  </Link>
                )}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  className="block rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </a>
              </>
             )}
          </div>
        </div>
      )}
    </header>
  )
}