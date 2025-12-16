'use client'

import { useState, useEffect } from 'react' // Import hooks
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Receipt, 
  Archive, 
  CheckSquare, 
  LogOut,
  FolderOpen
} from 'lucide-react'

const menuItems = [
  { name: 'Analytics', href: '/admin', icon: LayoutDashboard },
  { name: 'Pengeluaran', href: '/admin/expenses', icon: Receipt },
  { name: 'Program', href: '/admin/programs', icon: Archive },
  { name: 'Verifikasi', href: '/admin/verification', icon: CheckSquare },
  { name: 'Manajemen', href: '/admin/management', icon: FolderOpen },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // State untuk menyimpan data admin
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@shine.org');

  // Fetch data admin saat komponen dimuat
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/auth/me'); // Endpoint untuk cek user login
        if (res.ok) {
          const data = await res.json();
          // Pastikan data.user ada dan role-nya admin
          if (data.user && data.user.role === 'admin') {
            setAdminName(data.user.nama || 'Admin');
            setAdminEmail(data.user.email || 'admin@shine.org');
          }
        }
      } catch (error) {
        console.error("Gagal memuat data admin:", error);
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

  return (
    <aside className="hidden w-64 flex-col bg-white border-r border-gray-200 md:flex h-screen fixed left-0 top-0 z-50">
      
      {/* 1. Header Sidebar (Logo) */}
      <div className="flex h-16 items-center justify-center border-b border-gray-100 px-6">
        <Link href="/" className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
             <span className="text-xl font-bold text-gray-800 tracking-tight">ShineAdmin</span>
        </Link>
      </div>

      {/* 2. Menu Items (Scrollable area) */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
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
        })}
      </div>

      {/* 3. Footer Sidebar (User Profile & Logout) */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {/* Ambil inisial nama admin */}
                {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate" title={adminName}>{adminName}</p>
                <p className="text-xs text-gray-500 truncate" title={adminEmail}>{adminEmail}</p>
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
  )
}