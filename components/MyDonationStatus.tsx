'use client'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, Clock, XCircle, Package, CreditCard } from 'lucide-react'

interface DonationStatus {
  status: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  created_at: string;
}

export default function MyDonationStatus({ programId }: { programId: string }) {
  const [donation, setDonation] = useState<DonationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchMyStatus() {
      try {
        const res = await fetch(`/api/history/${programId}`);
        
        if (res.status === 401) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        
        if (res.status === 404) {
          // User login tapi belum donasi ke program ini
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
  
  // Jika tidak login atau tidak ada donasi, jangan tampilkan apa-apa (atau bisa tampilkan ajakan donasi)
  if (!isLoggedIn || !donation) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Diterima': return { color: 'bg-green-100 border-green-200 text-green-800', icon: <CheckCircle className="h-5 w-5 text-green-600"/> };
      case 'Pending': return { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: <Clock className="h-5 w-5 text-yellow-600"/> };
      case 'Ditolak': return { color: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle className="h-5 w-5 text-red-600"/> };
      default: return { color: 'bg-gray-50 border-gray-200 text-gray-800', icon: <Clock className="h-5 w-5"/> };
    }
  };

  const config = getStatusConfig(donation.status);

  return (
    <div className={`mb-8 rounded-xl border p-6 shadow-sm ${config.color}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
            {config.icon}
            Status Donasi Anda: {donation.status}
          </h3>
          <p className="text-sm opacity-90 mb-4">
            Donasi pada: {new Date(donation.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
               {donation.jenis_donasi === 'Uang' ? <CreditCard className="h-6 w-6 text-blue-600"/> : <Package className="h-6 w-6 text-orange-600"/>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide opacity-70">{donation.jenis_donasi}</p>
              <p className="text-xl font-bold">
                {donation.jenis_donasi === 'Uang' 
                  ? `Rp ${Number(donation.nominal).toLocaleString('id-ID')}` 
                  : donation.nama_barang}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}