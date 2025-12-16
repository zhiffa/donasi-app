'use client'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, Clock, XCircle, Package, CreditCard, Truck, MapPin } from 'lucide-react'

interface DonationStatus {
  id_donasi: number;
  status: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  created_at: string;
  metode_pengiriman?: string | null;
  jadwal?: {
    status_penjemputan: string;
  }
}

export default function MyDonationStatus({ programId }: { programId: string }) {
  const [donation, setDonation] = useState<DonationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchMyStatus() {
      try {
        // Kita fetch ke API history detail khusus untuk program ini
        // Note: Anda mungkin perlu API khusus /api/history/[programId] yang return 1 donasi terbaru user untuk program ini
        // Asumsi endpoint ini mengembalikan 1 donasi terbaru user untuk programId tersebut
        const res = await fetch(`/api/history/${programId}`); 
        
        if (res.status === 401) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        
        if (res.status === 404) {
          setIsLoggedIn(true);
          setDonation(null);
          setLoading(false);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setDonation(data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchMyStatus();
  }, [programId]);

  if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-gray-400"/></div>;
  
  if (!isLoggedIn || !donation) return null;

  // --- LOGIC RENDER TRACKING (Sama seperti di History Detail) ---
  const renderTracking = () => {
     // A. Jika Donasi Barang & Pick-up -> Tampilkan Progress Bar
     if (donation.jenis_donasi === 'Barang' && donation.metode_pengiriman === 'Pick-up' && donation.jadwal) {
         const steps = ['Dijadwalkan', 'Dalam Perjalanan', 'Selesai'];
         let currentIdx = steps.indexOf(donation.jadwal.status_penjemputan);
         if (donation.status === 'Diterima') currentIdx = 2;
         if (currentIdx === -1) currentIdx = 0;

         return (
             <div className="mt-4 pt-4 border-t">
                 <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Truck size={16}/> Status Penjemputan
                 </p>
                 <div className="relative flex justify-between items-center mb-6 mx-2">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
                      <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-700 ease-out" style={{width: `${(currentIdx / (steps.length-1)) * 100}%`}}></div>

                      {/* Step 1 */}
                      <div className="text-center bg-white px-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 border ${currentIdx >= 0 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}><Clock size={12}/></div>
                          <p className="text-[10px] font-bold text-gray-600">Jadwal</p>
                      </div>
                      {/* Step 2 */}
                      <div className="text-center bg-white px-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 border ${currentIdx >= 1 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}><Truck size={12}/></div>
                          <p className="text-[10px] font-bold text-gray-600">Jalan</p>
                      </div>
                       {/* Step 3 */}
                       <div className="text-center bg-white px-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 border ${currentIdx >= 2 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}><MapPin size={12}/></div>
                          <p className="text-[10px] font-bold text-gray-600">Sampai</p>
                      </div>
                 </div>
             </div>
         )
     }
     
     // B. Jika Donasi Uang atau Self-Delivery -> Tidak perlu tracking bar khusus, cukup status utama
     return null;
  }

  // --- CONFIG STATUS UTAMA ---
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Diterima': return { color: 'bg-green-50 border-green-200 text-green-800', icon: <CheckCircle className="h-5 w-5 text-green-600"/> };
      case 'Pending': return { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: <Clock className="h-5 w-5 text-yellow-600"/> };
      case 'Ditolak': return { color: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle className="h-5 w-5 text-red-600"/> };
      default: return { color: 'bg-gray-50 border-gray-200 text-gray-800', icon: <Clock className="h-5 w-5"/> };
    }
  };

  const config = getStatusConfig(donation.status);

  return (
    <div className={`mb-8 rounded-xl border p-6 shadow-sm ${config.color}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             {config.icon}
             <h3 className="font-bold text-lg">Status Donasi Anda: {donation.status}</h3>
          </div>
          <p className="text-sm opacity-80 mb-4">
            Donasi dibuat pada: {new Date(donation.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3 flex items-center gap-3 border border-gray-200/50">
            <div className="p-2 bg-white rounded-full shadow-sm">
               {donation.jenis_donasi === 'Uang' ? <CreditCard className="h-5 w-5 text-blue-600"/> : <Package className="h-5 w-5 text-orange-600"/>}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{donation.jenis_donasi}</p>
              <p className="text-lg font-bold text-gray-900">
                {donation.jenis_donasi === 'Uang' 
                  ? `Rp ${Number(donation.nominal).toLocaleString('id-ID')}` 
                  : donation.nama_barang}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER TRACKING BAR (JIKA ADA) */}
      {renderTracking()}

    </div>
  );
}