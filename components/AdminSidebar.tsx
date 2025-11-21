'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation' // Untuk menandai link aktif
import {
  LayoutDashboard,
  ReceiptText,
  ListChecks,
  Layers3,
  HandHeart,
  LogOut, // Ikon Logout
  Briefcase, // Ikon Tasks (contoh)
  MessageSquare, // Ikon Messages (contoh)
  CreditCard // Ikon Payments (contoh)
} from 'lucide-react'


const adminNavLinks = [
  { name: 'Analytics', href: '/admin', icon: LayoutDashboard }, // Dashboard = Analytics
  { name: 'Pengeluaran', href: '/admin/expenses', icon: ReceiptText },
  { name: 'Program', href: '/admin/programs', icon: Layers3 },
  { name: 'Verifikasi', href: '/admin/verification', icon: ListChecks },
  { name: 'Manajemen', href: '/admin/management', icon: HandHeart },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    // Mengubah warna background menjadi biru tua (mirip contoh)
    <aside className="w-60 bg-slate-900 text-gray-300 min-h-screen p-4 flex flex-col shadow-lg">
      <div className="mb-8 flex items-center justify-center space-x-2 pt-4">
        {/* Placeholder Logo/Icon */}
        <div className="bg-pink-400 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
      </div>
      <nav className="flex-grow">
        <ul>
          {adminNavLinks.map((link) => {
            // Logika aktif yang lebih presisi
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href) && link.href.split('/').length === pathname.split('/').length);
            // Khusus untuk link dashboard/analytics
            const isDashboardActive = link.href === '/admin' && pathname === '/admin';

            return (
              <li key={link.name} className="mb-1">
                <Link
                  href={link.href}
                  className={`flex items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-200 ${
                    isActive || isDashboardActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm' // Warna aktif biru
                      : 'hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <link.icon className={`mr-3 h-5 w-5 ${isActive || isDashboardActive ? 'text-white' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto border-t border-slate-500 pt-4">
         <button className="w-full text-left flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white">
             <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
         </button>
      </div>
    </aside>
  )
}