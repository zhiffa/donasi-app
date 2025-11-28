'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, Search, X, CreditCard } from 'lucide-react' // Tambah CreditCard

interface DonationRow {
  id_donasi: number;
  nama_donatur: string;
  nama_program: string | null;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  metode_pembayaran: string | null; // <-- Kolom Baru dari API
  status: 'Pending' | 'Diterima' | 'Ditolak';
  created_at: string;
}

interface Program {
  id_kegiatan: number;
  nama_program: string;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function DonationManagementPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [filterStatus, setFilterStatus] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [programsList, setProgramsList] = useState<Program[]>([]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/admin/programs');
      if (!res.ok) throw new Error('Gagal memuat program');
      const data = await res.json();
      setProgramsList(data.map((p: any) => ({
        id_kegiatan: p.id_kegiatan,
        nama_program: p.nama_program
      })));
    } catch (err: any) {
      console.error("Error fetching programs:", err.message);
    }
  };
  
  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (filterProgram) params.append('program', filterProgram);
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

    try {
      const res = await fetch(`/api/admin/management?${params.toString()}`);
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
  }, [filterStatus, filterProgram, debouncedSearchQuery]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Donasi</h1>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="relative">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari Nama Donatur</label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama..."
            className="w-full rounded-md border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
           <Search className="absolute left-3 top-8 h-5 w-5 text-gray-400" />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
          <select
            id="status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Diterima">Diterima</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        <div>
           <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">Filter Program</label>
          <select
            id="program"
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Semua Program</option>
            {programsList.map(program => (
              <option key={program.id_kegiatan} value={program.id_kegiatan}>{program.nama_program}</option>
            ))}
          </select>
        </div>
      </div>

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
                
                {/* Kolom Baru: Metode */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                
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
                    
                    {/* Isi Kolom Metode */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {don.metode_pembayaran === 'Midtrans' ? (
                            <span className="flex items-center gap-1 text-blue-600 font-semibold">
                                <CreditCard size={16}/> Otomatis
                            </span>
                        ) : (
                            <span className="text-gray-600">{don.metode_pembayaran || 'Manual'}</span>
                        )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{don.jenis_donasi}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{renderDonationDetails(don)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(don.status)}`}>
                        {don.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data donasi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail */}
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
                
                {/* Tampilkan Metode di Modal juga */}
                <p><strong>Metode:</strong> {selectedDonation.metode_pembayaran || 'Manual'}</p>
                
                {selectedDonation.jenis_donasi === 'Uang' && (
                    <p><strong>Nominal:</strong> Rp {Number(selectedDonation.nominal).toLocaleString('id-ID')}</p>
                )}
                {selectedDonation.jenis_donasi === 'Barang' && (
                    <p><strong>Detail Barang:</strong> {selectedDonation.nama_barang}</p>
                )}
                <p><strong>Program:</strong> {selectedDonation.nama_program || '-'}</p>
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