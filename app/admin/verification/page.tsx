'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, Loader2, X } from 'lucide-react' // <-- PERBAIKAN: Tambahkan 'X' di sini

// Interface disesuaikan dengan DB
interface DonationRow {
  id_donasi: number; // Ganti id_layanan
  nama_donatur: string;
  jenis_donasi: 'Uang' | 'Barang'; // Ganti layanan_type, perhatikan kapitalisasi
  nominal: number | null;
  nama_barang: string | null;
  status: 'Pending' | 'Diterima' | 'Ditolak'; // Enum DB
  created_at: string;
}

// Modal Detail bisa menggunakan tipe yang sama untuk simplifikasi
// atau fetch detail lengkap jika diperlukan

export default function DonationVerificationPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // State Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);

  const fetchDonations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/verification');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal mengambil data');
      }
      const data: DonationRow[] = await res.json();
      setDonations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Handler VERIFY (Diterima)
  const handleVerify = async (id: number) => {
    if (!confirm(`Yakin ingin memverifikasi donasi #${id}?`)) return;

    try {
      // Menggunakan PATCH sesuai file route backend
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Diterima' })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memverifikasi');
      }

      alert(data.message);
      fetchDonations(); 

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handler DECLINE (Ditolak)
  const handleDecline = async (id: number) => {
    const reason = window.prompt(`Masukkan alasan menolak donasi #${id}:`);
    
    if (reason === null) return;
    if (!reason) {
         alert("Alasan penolakan harus diisi.");
         return;
    }

    try {
       // Menggunakan PATCH sesuai file route backend
       const res = await fetch(`/api/admin/verification/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ditolak', reason: reason }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menolak donasi');
      }

      alert(data.message);
      fetchDonations();

    } catch (err: any) {
       alert(`Error: ${err.message}`);
    }
  };

  const handleViewDetail = (don: DonationRow) => {
    setSelectedDonation(don);
    setShowDetailModal(true);
  };

  const renderDonationDetails = (donation: DonationRow) => {
    if (donation.jenis_donasi === 'Uang') {
      return `Rp ${Number(donation.nominal).toLocaleString('id-ID')}`;
    }
    if (donation.jenis_donasi === 'Barang') {
      return donation.nama_barang || 'Barang';
    }
    return '-';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Ditolak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Verifikasi Donasi</h1>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">Error: {error}</p>
             <button onClick={fetchDonations} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
               Coba Lagi
            </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Donasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Donatur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Donasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail (Preview)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations.length > 0 ? (
                donations.map((don) => (
                  <tr key={don.id_donasi}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{don.id_donasi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{don.nama_donatur}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{don.jenis_donasi}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{renderDonationDetails(don)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(don.status)}`}>
                        {don.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {don.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(don.id_donasi)}
                            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100"
                            title="Verifikasi (Terima)"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleDecline(don.id_donasi)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                            title="Tolak"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetail(don)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada data donasi untuk diverifikasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Detail Donasi #{selectedDonation.id_donasi}</h2>
             <div className="space-y-2 text-sm mb-4">
                <p><strong>Nama Donatur:</strong> {selectedDonation.nama_donatur}</p>
                <p><strong>Jenis Donasi:</strong> {selectedDonation.jenis_donasi}</p>
                {selectedDonation.jenis_donasi === 'Uang' && (
                    <p><strong>Nominal:</strong> Rp {Number(selectedDonation.nominal).toLocaleString('id-ID')}</p>
                )}
                {selectedDonation.jenis_donasi === 'Barang' && (
                    <p><strong>Detail Barang:</strong> {selectedDonation.nama_barang}</p>
                )}
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedDonation.status)}`}>{selectedDonation.status}</span></p>
             </div>
             <button
                onClick={() => setShowDetailModal(false)}
                className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
             >
               Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}