'use client'
import { useState, useEffect } from 'react'
import { User, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// Interface yang sudah mendukung deskripsi_barang
interface PublicDonation {
  id: number;
  nama: string;
  nominal: number | null;
  nama_barang: string | null;
  deskripsi_barang: string | null;
  jenis: 'Uang' | 'Barang';
  tanggal: string;
}

export default function DonasiMasuk({ programId }: { programId: string }) {
  const [donations, setDonations] = useState<PublicDonation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data dari API
  const fetchDonations = async () => {
    try {
      const res = await fetch(`/api/public/donations/${programId}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch (error) {
      console.error("Gagal fetch donasi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();

    // REALTIME SUBSCRIPTION
    // Mendengarkan perubahan di tabel 'donasi' secara langsung
    const channel = supabase
      .channel(`live_donations_report_${programId}`)
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'donasi',
          filter: `id_kegiatan=eq.${programId}`
        },
        (payload) => {
          console.log("Update terdeteksi:", payload);
          fetchDonations(); // Refresh data otomatis
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [programId]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden h-full">
      <div className="bg-blue-50 p-4 border-b border-blue-100">
        <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
          <span className="bg-blue-200 text-blue-700 py-1 px-2 rounded text-xs">{donations.length}</span>
          Donasi Masuk (Real-time)
        </h3>
      </div>
      
      <div className="p-0 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">
            Belum ada donasi terverifikasi.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {donations.map((d) => (
              <li key={d.id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                {/* Avatar Icon */}
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200">
                  <User size={20} />
                </div>
                
                {/* Info Donatur */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{d.nama}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(d.tanggal).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                
                {/* Detail Donasi (Uang/Barang) */}
                <div className="text-right shrink-0">
                  {d.jenis === 'Barang' ? (
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-orange-600 block text-sm max-w-[150px] truncate" title={d.nama_barang || ''}>
                        {d.nama_barang || 'Barang'}
                      </span>
                      {/* Menampilkan deskripsi barang jika ada */}
                      {d.deskripsi_barang && (
                        <span className="text-[10px] text-gray-500 italic max-w-[120px] truncate leading-tight">
                          {d.deskripsi_barang}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-bold text-green-600 block">
                      + Rp {Number(d.nominal).toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 font-bold uppercase bg-gray-100 px-2 py-0.5 mt-1 rounded inline-block">
                    {d.jenis}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}