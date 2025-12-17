'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link' // Import Link
import { Search, Bell, UserCircle, Menu, Home } from 'lucide-react' // Tambah import icon Home

export default function AdminHeader() {
  const [adminName, setAdminName] = useState('Admin');
  const [adminJabatan, setAdminJabatan] = useState('Memuat...');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me'); 
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setAdminName(data.user.nama || 'Admin');
            setAdminJabatan(data.user.jabatan || 'Staf'); 
          }
        }
      } catch (error) {
        console.error('Gagal mengambil data header:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center">
      <div className="flex-1 flex items-center justify-between px-6 md:px-8">
        
        {/* Toggle Menu Mobile */}
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

        {/* Bagian Kanan (Actions) */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* --- TOMBOL HOME BARU --- */}
          {/* Menggantikan fungsi menu 'Donate' / Home */}
          <Link href="/" title="Kembali ke Website Utama">
            <button className="relative p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition duration-200">
              <Home size={20} />
            </button>
          </Link>
          {/* ------------------------- */}

          {/* Notifikasi */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
          
          {/* Profil Admin */}
          <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80">
             <div className="text-right hidden md:block">
                 <p className="text-sm font-bold text-gray-700 leading-none">
                    {adminName}
                 </p>
                 <p className="text-[10px] text-gray-500 font-medium">
                    {adminJabatan}
                 </p>
             </div>
             <UserCircle size={32} className="text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}