'use client'
import { useState, useEffect } from 'react'
import { User, Loader2 } from 'lucide-react'

interface PublicDonation {
  id: number;
  nama: string;
  nominal: number | null;
  barang: string | null;
  jenis: 'Uang' | 'Barang';
  tanggal: string;
}

export default function DonasiMasuk({ programId }: { programId: string }) {
  const [donations, setDonations] = useState<PublicDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await fetch(`/api/public/donations/${programId}`);
        if (res.ok) {
          const data = await res.json();
          setDonations(data);
        }
      } catch (error) {
        console.error("Failed to fetch public donations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [programId]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-blue-50 p-4 border-b border-blue-100">
        <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
          <span className="bg-blue-200 text-blue-700 py-1 px-2 rounded text-xs">{donations.length}</span>
          Donasi Masuk
        </h3>
      </div>
      
      <div className="p-0 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada donasi masuk. Jadilah yang pertama!</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {donations.map((d) => (
              <li key={d.id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{d.nama}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  {d.jenis === 'Uang' ? (
                    <span className="font-bold text-green-600 block">
                      + Rp {Number(d.nominal).toLocaleString('id-ID')}
                    </span>
                  ) : (
                    <span className="font-bold text-orange-600 block text-sm max-w-[150px] truncate">
                      {d.barang}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 uppercase">{d.jenis}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}