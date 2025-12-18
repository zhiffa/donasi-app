import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader' 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar fixed di kiri */}
      <AdminSidebar />

      {/* Main Content: 
          Diberikan margin kiri (ml-64) pada layar desktop (md) 
          agar konten tidak tertumpuk di bawah/belakang sidebar.
      */}
      <div className="flex flex-col min-h-screen transition-all duration-300 md:ml-64">
        
        {/* Header Admin */}
        <AdminHeader />

        {/* Isi Halaman Dashboard */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full">
               {children}
            </div>
        </main>

        {/* Footer Admin */}
        <footer className="border-t border-gray-200 bg-white py-6 px-6 md:px-10 text-center md:text-left mt-auto">
           <p className="text-xs text-gray-400 font-medium">
             &copy; {new Date().getFullYear()} Shine in Smiles Admin Panel. 
             <span className="hidden sm:inline"> | Sistem Manajemen Donasi & Program</span>
           </p>
        </footer>
      </div>
    </div>
  )
}