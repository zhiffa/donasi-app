'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogIn, AlertTriangle, Inbox, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Interface Sederhana (Tanpa status_penjemputan/jadwal)
interface HistoryItem {
  id_donasi: number;
  tanggal_donasi: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  status: string; // Hanya Pending, Diterima, Ditolak
  nama_program: string;
  url_poster?: string | null;
}

export default function HistoryPage() {
  const router = useRouter();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setAuthStatus('loading');
      setError(null);
      try {
        const res = await fetch('/api/history'); 

        if (res.status === 401) {
          setAuthStatus('unauthenticated');
          return;
        }

        if (!res.ok) {
          throw new Error('Gagal memuat riwayat');
        }

        const data: HistoryItem[] = await res.json();
        setHistory(data);
        setAuthStatus('authenticated');

      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data. Silakan coba lagi.");
        setAuthStatus('authenticated'); 
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return '-'; }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Ditolak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Diterima': return <CheckCircle size={16} className="text-green-600"/>;
        case 'Ditolak': return <XCircle size={16} className="text-red-600"/>;
        default: return <Clock size={16} className="text-yellow-600"/>;
      }
  };

  // --- RENDER ---

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-500 font-medium">Memuat riwayat donasi...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="h-8 w-8 text-blue-600" />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Diperlukan</h1>
           <p className="text-gray-500 mb-8">Silakan login untuk melihat riwayat kebaikan Anda.</p>
           <Link 
             href="/login?redirect=/history"
             className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
           >
             Masuk Sekarang
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Riwayat Donasi</h1>
        
        {error && (
           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertTriangle size={20}/> {error}
           </div>
        )}

        {history.length === 0 && !error ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Riwayat</h3>
            <p className="text-gray-500 mb-8">Anda belum melakukan donasi apapun saat ini.</p>
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Mulai Berdonasi
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                  <tr>
                      <th className="px-6 py-4">Program</th>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Jenis</th>
                      <th className="px-6 py-4">Detail</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                  {history.map((item) => (
                      <tr 
                        key={item.id_donasi} 
                        className="hover:bg-blue-50/50 transition duration-150 cursor-pointer group"
                        onClick={() => router.push(`/history/${item.id_donasi}`)}
                      >
                          {/* Program & Gambar */}
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                    {item.url_poster ? (
                                        <Image src={item.url_poster} alt="Poster" fill className="object-cover" sizes="48px"/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No img</div>
                                    )}
                                  </div>
                                  <span className="font-semibold text-gray-900 line-clamp-2 max-w-[200px]">
                                      {item.nama_program}
                                  </span>
                              </div>
                          </td>
                          
                          {/* Tanggal */}
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                              {formatDate(item.tanggal_donasi)}
                          </td>

                          {/* Jenis */}
                          <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${item.jenis_donasi === 'Uang' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {item.jenis_donasi}
                              </span>
                          </td>

                          {/* Detail (Nominal/Barang) */}
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {item.jenis_donasi === 'Uang' 
                                  ? `Rp ${Number(item.nominal).toLocaleString('id-ID')}`
                                  : <span className="truncate max-w-[150px] block" title={item.nama_barang || ''}>{item.nama_barang}</span>
                              }
                          </td>

                          {/* Status (Hanya Pending/Diterima/Ditolak) */}
                          <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                                  {getStatusIcon(item.status)}
                                  {item.status}
                              </span>
                          </td>

                          {/* Aksi (Tombol Mata) */}
                          <td className="px-6 py-4 text-center">
                             <button className="text-gray-400 group-hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-100">
                                <Eye size={20}/>
                             </button>
                          </td>
                      </tr>
                  ))}
                  </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">Klik pada baris donasi untuk melihat detail lengkap, pelacakan, dan tanda terima.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}