'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Receipt, 
  Archive, 
  CheckSquare, 
  LogOut,
  FolderOpen,
  Loader2,
  Menu, // Icon Menu
  X     // Icon Close
} from 'lucide-react'

const menuItems = [
  { 
    name: 'Analytics', 
    href: '/admin', 
    icon: LayoutDashboard,
    allowedRoles: ['Super Admin', 'Admin Program', 'Admin Operasional'] 
  },
  { 
    name: 'Pengeluaran', 
    href: '/admin/expenses', 
    icon: Receipt,
    allowedRoles: ['Super Admin', 'Admin Program'] 
  },
  { 
    name: 'Program', 
    href: '/admin/programs', 
    icon: Archive,
    allowedRoles: ['Super Admin', 'Admin Program'] 
  },
  { 
    name: 'Verifikasi', 
    href: '/admin/verification', 
    icon: CheckSquare,
    allowedRoles: ['Super Admin', 'Admin Operasional'] 
  },
  { 
    name: 'Manajemen', 
    href: '/admin/management', 
    icon: FolderOpen,
    allowedRoles: ['Super Admin', 'Admin Operasional'] 
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // --- STATE UNTUK MOBILE SIDEBAR ---
  const [isOpen, setIsOpen] = useState(false)
  // ----------------------------------

  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@shine.org');
  const [adminJabatan, setAdminJabatan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/auth/me'); 
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setAdminName(data.user.nama || 'Admin');
            setAdminEmail(data.user.email || 'admin@shine.org');
            setAdminJabatan(data.user.jabatan || ''); 
          }
        }
      } catch (error) {
        console.error("Gagal memuat data admin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      } catch (error) {
        console.error('Logout failed', error);
      }
  };

  const toggleSidebar = () => setIsOpen(!isOpen)

  // Tutup sidebar otomatis saat berpindah halaman di mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const filteredMenuItems = menuItems.filter(item => 
    item.allowedRoles.includes(adminJabatan)
  );

  return (
    <>
      {/* 1. TOMBOL HAMBURGER (Hanya muncul di Mobile) */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-3 left-4 z-[60] flex h-10 w-10 items-center justify-center rounded-lg bg-white border shadow-md text-gray-600 md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 2. OVERLAY (Latar gelap saat sidebar buka di mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm md:hidden" 
          onClick={toggleSidebar}
        />
      )}

      {/* 3. ASIDE CORE (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[58] flex w-64 flex-col bg-white border-r border-gray-200 h-screen transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static
      `}>
        
        {/* Header Sidebar */}
        <div className="flex h-16 items-center justify-center border-b border-gray-100 px-6">
          <Link href="/" className="flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
               <span className="text-xl font-bold text-gray-800 tracking-tight">ShineAdmin</span>
          </Link>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
          
          {isLoading ? (
            <div className="flex flex-col gap-2 px-4 mt-4 text-gray-400 text-sm animate-pulse">
              <div className="h-8 bg-gray-100 rounded w-full"></div>
              <div className="h-8 bg-gray-100 rounded w-full"></div>
              <div className="h-8 bg-gray-100 rounded w-full"></div>
              <span className="flex items-center gap-2 mt-2"><Loader2 className="animate-spin" size={16}/> Memuat...</span>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="px-4 py-4 text-center text-red-500 bg-red-50 rounded-lg text-xs">
              <p className="font-bold">Akses Menu Kosong</p>
              <p className="mt-1">Jabatan: "{adminJabatan}"</p>
            </div>
          ) : (
            filteredMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                  {item.name}
                </Link>
              )
            })
          )}
        </div>

        {/* Footer Sidebar */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{adminName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isLoading ? '...' : (adminJabatan || adminEmail)}
                  </p>
              </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}