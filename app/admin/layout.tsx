import AdminSidebar from '@/components/AdminSidebar'
import { Search, Bell, UserCircle } from 'lucide-react' // Ikon untuk header

// Komponen Header Atas Internal (agar file tetap rapi)
function AdminHeader() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Bagian Kiri: Search Bar */}
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-md border border-gray-300 bg-gray-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* Bagian Kanan: Ikon & User */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700 relative">
            <Bell size={20} />
             {/* Notifikasi badge (opsional) */}
             <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <div className="flex items-center space-x-2 cursor-pointer">
             <UserCircle size={24} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Hi, Admin</span> {/* TODO: Ganti nama user dinamis */}
            {/* Dropdown menu user bisa ditambahkan di sini */}
          </div>
        </div>
      </div>
    </header>
  );
}

// Layout utama untuk semua halaman di bawah /admin
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Menggunakan flexbox untuk layout sidebar + konten
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar dari komponen terpisah */}
      <AdminSidebar />

      {/* Kontainer untuk header dan konten utama */}
      <div className="flex flex-col flex-1 overflow-hidden">
         {/* Header Atas */}
         <AdminHeader />

        {/* Konten utama halaman dengan scroll */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}