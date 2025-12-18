import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader' 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar sekarang melayang (fixed) di mobile dan 
          masuk ke dalam flow (static/fixed) di desktop 
      */}
      <AdminSidebar />

      {/* Main Content Area: 
          - pl-0 di mobile agar konten full screen.
          - md:pl-64 di desktop agar memberi ruang untuk sidebar.
      */}
      <div className="flex flex-col min-h-screen transition-all duration-300 md:pl-64">
        
        {/* Header Admin (Sticky/Fixed di dalam container ini) */}
        <AdminHeader />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            {/* Container max-w agar konten tidak terlalu melebar di layar ultra-wide 
                dan tetap rapi di mobile.
            */}
            <div className="max-w-7xl mx-auto w-full">
               {children}
            </div>
        </main>

        {/* Footer Admin */}
        <footer className="border-t border-gray-200 bg-white py-6 px-6 md:px-10 text-center md:text-left">
           <p className="text-xs text-gray-400 font-medium">
             &copy; {new Date().getFullYear()} Shine in Smiles Admin Panel. 
             <span className="hidden sm:inline"> | Sistem Manajemen Donasi & Program</span>
           </p>
        </footer>
      </div>
    </div>
  )
}