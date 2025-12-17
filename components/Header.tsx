'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, User, ChevronDown, LogOut } from 'lucide-react'

interface User {
  nama: string;
  role: string; 
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // --- LOGIKA BARU: Sembunyikan Header ini jika di halaman Admin ---
  // Pastikan hook usePathname dipanggil sebelum return
  const isPageAdmin = pathname?.startsWith('/admin');
  
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Jika di halaman admin, kita tidak perlu fetch user untuk header ini
    if (isPageAdmin) return;

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
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
  }, [pathname, isPageAdmin]);

  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setAuthStatus('unauthenticated');
      setIsProfileOpen(false);
      router.push('/');
      router.refresh();
    }
  };

  const navLinks = [
    { name: 'Donate', href: '/#donate' },
    { name: 'Programs', href: '/#programs' },
    { name: 'History', href: '/history' },
    { name: 'About', href: '/#about' },
  ]

  const isAdmin = (role: string) => {
    return role === 'admin' || role.includes('Admin') || role === 'Super Admin';
  };

  // --- EKSEKUSI HIDE DISINI ---
  if (isPageAdmin) {
    return null;
  }
  // ---------------------------

  return (
    <header className="sticky top-0 z-50 w-full h-23 bg-white shadow-sm">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
        {/* Kiri: Logo */}
        <Link href="/">
          <Image
            src="/logo.png"
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

          {/* === Tombol Login / Profile Dropdown (Desktop) === */}
          <div className="relative">
            {authStatus === 'loading' && (
              <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200"></div>
            )}
            
            {authStatus === 'unauthenticated' && (
              <Link
                href="/login"
                className="font-medium text-gray-700 hover:text-pastel-pink-dark"
              >
                Login
              </Link>
            )}

            {authStatus === 'authenticated' && user && (
              <div>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 rounded-full p-2 font-medium text-gray-700 hover:bg-gray-100"
                >
                  <User size={18} />
                  Hi, {user.nama.split(' ')[0]} 
                  <ChevronDown size={16} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {isAdmin(user.role) && (
                        <Link
                        href="/admin"
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                {isAdmin(user.role) && (
                  <Link
                    href="/admin"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-pastel-pink-dark"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard Admin
                  </Link>
                )}
                 <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
              </>
              )}
          </div>
        </div>
      )}
    </header>
  )
}