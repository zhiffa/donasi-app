'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, LogIn, AlertTriangle, Inbox, Eye } from 'lucide-react'

// Interface disesuaikan dengan API /api/history (Flattened)
interface HistoryItem {
  id_donasi: number;
  tanggal_donasi: string; // Supabase returns string for TIMESTAMPTZ
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  status: string; 
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
          const data = await res.json();
          throw new Error(data.message || 'Gagal memuat riwayat');
        }

        const data: HistoryItem[] = await res.json();
        setHistory(data);
        setAuthStatus('authenticated');

      } catch (err: any) {
        setError(err.message);
        setAuthStatus('authenticated'); // Tetap render halaman meski error data
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderDonationDetails = (item: HistoryItem) => {
    if (item.jenis_donasi === 'Uang') {
      return (
        <span className="font-semibold text-green-600">
          Rp {Number(item.nominal).toLocaleString('id-ID')}
        </span>
      );
    }
    if (item.jenis_donasi === 'Barang') {
      return (
        <span className="font-semibold text-blue-600 truncate max-w-xs block" title={item.nama_barang || ''}>
          {item.nama_barang || 'Donasi Barang'}
        </span>
      );
    }
    return '-';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Ditolak': return 'bg-red-100 text-red-800';
      case 'Dijadwalkan': return 'bg-blue-100 text-blue-800';
      case 'Selesai': return 'bg-green-100 text-green-800'; // Untuk status program/penjemputan
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- Handler Navigasi ---
  const handleRowClick = (id: number) => {
    router.push(`/history/${id}`);
  };

  // --- Render ---

  if (authStatus === 'loading') {
    return (
      <div className="container mx-auto min-h-screen px-4 py-16 text-center flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
        <p className="mt-4 text-lg text-gray-600">Memuat riwayat donasi...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto min-h-screen px-4 py-16 text-center flex items-center justify-center">
        <div className="max-w-lg bg-white p-8 md:p-12 rounded-lg shadow-xl border border-gray-100">
           <LogIn className="h-16 w-16 mx-auto text-blue-600" />
           <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-4">Anda Belum Login</h1>
           <p className="mb-6 text-lg text-gray-700">
             Silakan login terlebih dahulu untuk melihat riwayat donasi Anda.
           </p>
           <Link 
             href="/login?redirect=/history"
             className="inline-block rounded-full bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700 shadow-md"
           >
             Login di Sini
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold text-center text-gray-800">Riwayat Donasi Anda</h1>
      
      {error && (
         <div className="max-w-5xl mx-auto rounded-md bg-red-50 p-4 text-center text-red-700 mb-6 border border-red-200">
            <AlertTriangle className="h-6 w-6 inline-block mr-2" /> Terjadi kesalahan: {error}
         </div>
      )}

      {history.length === 0 && !error && (
        <div className="text-center max-w-lg mx-auto bg-white p-8 md:p-12 rounded-lg shadow-xl border border-gray-100">
          <Inbox className="h-16 w-16 mx-auto text-gray-400" />
          <p className="mb-6 mt-4 text-xl text-gray-700">
            Anda belum memiliki riwayat donasi.
          </p>
          <Link 
            href="/"
            className="inline-block rounded-full bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            Mulai Donasi Sekarang
          </Link>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poster</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                    <tr 
                      key={item.id_donasi} 
                      onClick={() => handleRowClick(item.id_donasi)}
                      className="hover:bg-blue-50 transition cursor-pointer group"
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                           {item.url_poster ? (
                              <Image
                                src={item.url_poster}
                                alt={item.nama_program}
                                width={80}
                                height={50}
                                className="object-cover rounded-md h-12 w-auto"
                              />
                           ) : (
                              <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                           )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                            {item.nama_program}
                            </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.tanggal_donasi)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{item.jenis_donasi}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{renderDonationDetails(item)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                           <Eye size={18} className="group-hover:text-blue-600 transition-colors"/>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4 italic">Klik pada baris untuk melihat detail & tanda terima</p>
        </div>
      )}
    </div>
  )
}