import AdminSidebar from '@/components/AdminSidebar'
import { Search, Bell, UserCircle, Menu } from 'lucide-react'

// Header Atas (Top Bar)
function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center">
      <div className="flex-1 flex items-center justify-between px-6 md:px-8">
        
        {/* Toggle Menu Mobile (Visible only on mobile) */}
        <button className="md:hidden p-2 text-gray-600">
            <Menu size={24}/>
        </button>

        {/* Search Bar */}
        <div className="relative hidden md:block w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Cari data donasi, program..." 
             className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
           />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
          
          <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80">
             <div className="text-right hidden md:block">
                 <p className="text-sm font-bold text-gray-700 leading-none">Admin</p>
                 <p className="text-[10px] text-gray-500 font-medium">Operasional</p>
             </div>
             <UserCircle size={32} className="text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar (Fixed Position) */}
      <AdminSidebar />

      {/* Main Content Area */}
      {/* pl-64 (padding-left: 16rem) digunakan agar konten tidak tertutup sidebar yang lebarnya w-64 */}
      <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header */}
        <AdminHeader />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>

        {/* Footer Admin (Opsional) */}
        <footer className="border-t border-gray-200 bg-white py-4 px-8 text-center md:text-left">
           <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Shine in Smiles Admin Panel. All rights reserved.
           </p>
        </footer>
      </div>
    </div>
  )
}