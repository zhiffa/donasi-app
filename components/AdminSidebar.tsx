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
  Loader2 // Icon loading
} from 'lucide-react'

// Pastikan penulisan Role di sini SAMA PERSIS dengan di database kamu (Case Sensitive)
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
  
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@shine.org');
  const [adminJabatan, setAdminJabatan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true); // Default Loading = true

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/auth/me'); 
        if (res.ok) {
          const data = await res.json();
          
          // --- DEBUGGING: Cek console browser (F12) untuk lihat isinya ---
          console.log('Data User dari API:', data.user); 
          // -------------------------------------------------------------

          if (data.user) {
            setAdminName(data.user.nama || 'Admin');
            setAdminEmail(data.user.email || 'admin@shine.org');
            // Pastikan field 'jabatan' ada. Jika tidak, fallback ke string kosong
            setAdminJabatan(data.user.jabatan || ''); 
          }
        }
      } catch (error) {
        console.error("Gagal memuat data admin:", error);
      } finally {
        setIsLoading(false); // Selesai loading (berhasil/gagal)
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

  // Filter Menu
  const filteredMenuItems = menuItems.filter(item => 
    item.allowedRoles.includes(adminJabatan)
  );

  return (
    <aside className="hidden w-64 flex-col bg-white border-r border-gray-200 md:flex h-screen fixed left-0 top-0 z-50">
      
      {/* 1. Header Sidebar */}
      <div className="flex h-16 items-center justify-center border-b border-gray-100 px-6">
        <Link href="/" className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
             <span className="text-xl font-bold text-gray-800 tracking-tight">ShineAdmin</span>
        </Link>
      </div>

      {/* 2. Menu Items */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
        
        {/* LOGIKA TAMPILAN: */}
        {isLoading ? (
          // Tampilan saat Loading
          <div className="flex flex-col gap-2 px-4 mt-4 text-gray-400 text-sm animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-full"></div>
            <div className="h-8 bg-gray-100 rounded w-full"></div>
            <div className="h-8 bg-gray-100 rounded w-full"></div>
            <span className="flex items-center gap-2 mt-2"><Loader2 className="animate-spin" size={16}/> Memuat menu...</span>
          </div>
        ) : filteredMenuItems.length === 0 ? (
          // Tampilan jika jabatan tidak dikenali / kosong
          <div className="px-4 py-4 text-center text-red-500 bg-red-50 rounded-lg text-xs">
            <p className="font-bold">Akses Menu Kosong</p>
            <p className="mt-1">Jabatan anda: "{adminJabatan}"</p>
            <p className="mt-1">Tidak ada menu yang cocok.</p>
          </div>
        ) : (
          // Tampilan Menu Normal
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

      {/* 3. Footer Sidebar */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate" title={adminName}>{adminName}</p>
                <p className="text-xs text-gray-500 truncate" title={adminJabatan || adminEmail}>
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
  )
}