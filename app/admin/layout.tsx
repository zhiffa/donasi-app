import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader' 

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
      <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Panggil Komponen Header Dinamis */}
        <AdminHeader />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>

        {/* Footer Admin */}
        <footer className="border-t border-gray-200 bg-white py-4 px-8 text-center md:text-left">
           <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Shine in Smiles Admin Panel. All rights reserved.
           </p>
        </footer>
      </div>
    </div>
  )
}