'use client'
import { useState, useEffect, useCallback } from 'react'
import { Eye, Loader2, Search, X, CreditCard, Truck, Package, Phone, Save, Edit2, MapPin } from 'lucide-react'

// Interface Data
interface DonationRow {
  id_donasi: number;
  nama_donatur: string;
  id_donatur: number;
  no_telp: string | null;
  nama_program: string | null;
  status_program: string | null;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  metode_pembayaran: string | null;
  status: 'Pending' | 'Diterima' | 'Ditolak';
  created_at: string;
  // Tracking Data
  metode_pengiriman?: string | null;
  nomor_resi?: string | null;
  status_penjemputan?: string | null;
}

interface Program {
  id_kegiatan: number;
  nama_program: string;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function DonationManagementPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [programsList, setProgramsList] = useState<Program[]>([]);

  // Modal & Actions States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);

  // 1. Fetch Programs
  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/admin/programs');
      if (res.ok) {
        const data = await res.json();
        setProgramsList(data);
      }
    } catch (err) { console.error(err); }
  };
  
  // 2. Fetch Donations
  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    
    if (filterStatus) params.append('status', filterStatus);
    if (filterProgram) params.append('program', filterProgram);
    if (filterJenis) params.append('jenis', filterJenis);
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

    try {
      const res = await fetch(`/api/admin/management?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setDonations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterProgram, filterJenis, debouncedSearchQuery]);

  useEffect(() => { fetchPrograms(); }, []);
  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  // Handler Detail
  const handleViewDetail = (don: DonationRow) => {
     setSelectedDonation(don);
     setNewPhone(don.no_telp || ''); 
     setIsEditingPhone(false);
     setShowDetailModal(true);
  };

  // Handler Save Phone
  const handleSavePhone = async () => {
      if (!selectedDonation) return;
      setIsSavingPhone(true);
      try {
          const res = await fetch('/api/admin/donors/update', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_donatur: selectedDonation.id_donatur, no_telp: newPhone })
          });

          if (!res.ok) throw new Error('Gagal update nomor telepon');
          alert('Nomor telepon berhasil diperbarui!');
          
          const updatedDonation = { ...selectedDonation, no_telp: newPhone };
          setSelectedDonation(updatedDonation);
          setDonations(prev => prev.map(d => d.id_donasi === updatedDonation.id_donasi ? updatedDonation : d));
          setIsEditingPhone(false);
      } catch (e: any) {
          alert(e.message);
      } finally {
          setIsSavingPhone(false);
      }
  };

  // Handler Update Delivery (Pick-up & Self-Delivery)
  const handleUpdateDeliveryStatus = async (newStatus: string) => {
      if (!selectedDonation) return;
      setIsUpdatingDelivery(true);
      try {
          const res = await fetch('/api/admin/delivery', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ donationId: selectedDonation.id_donasi, status: newStatus })
          });
          
          if (!res.ok) throw new Error('Gagal update status');
          
          alert('Status logistik berhasil diupdate!');
          
          // Update state lokal
          const updatedDonation = { ...selectedDonation, status_penjemputan: newStatus };
          setSelectedDonation(updatedDonation);
          setDonations(prev => prev.map(d => d.id_donasi === updatedDonation.id_donasi ? updatedDonation : d));

      } catch (e: any) {
          alert(e.message);
      } finally {
          setIsUpdatingDelivery(false);
      }
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

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cari Donatur</label>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nama..." className="w-full rounded-md border-gray-300 border py-2 pl-10 pr-2 sm:text-sm" />
           <Search className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Status Donasi</label>
           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-2 sm:text-sm">
             <option value="">Semua Status</option>
             <option value="Pending">Pending</option>
             <option value="Diterima">Diterima</option>
             <option value="Ditolak">Ditolak</option>
           </select>
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Donasi</label>
           <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-2 sm:text-sm">
             <option value="">Semua Jenis</option>
             <option value="Uang">Uang</option>
             <option value="Barang">Barang</option>
           </select>
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Program Berjalan</label>
           <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="w-full rounded-md border border-gray-300 py-2 px-2 sm:text-sm">
             <option value="">Semua Program</option>
             {programsList.map(p => (<option key={p.id_kegiatan} value={p.id_kegiatan}>{p.nama_program}</option>))}
           </select>
        </div>
      </div>

      {isLoading && <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>}
      {error && <div className="p-6 text-center text-red-600 border border-red-200 bg-red-50 rounded">Error: {error}</div>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations.length > 0 ? (
                donations.map((don) => (
                  <tr key={don.id_donasi} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{don.nama_donatur}</div>
                        <div className="text-xs text-gray-500">{don.no_telp || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{don.nama_program}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                       <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 w-fit rounded text-xs font-bold ${don.jenis_donasi === 'Uang' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                             {don.jenis_donasi}
                          </span>
                          {don.jenis_donasi === 'Barang' && (
                              <span className="text-[10px] flex items-center gap-1">
                                {don.metode_pengiriman === 'Pick-up' ? <Truck size={12}/> : <Package size={12}/>}
                                {don.metode_pengiriman || '-'}
                                {don.status_penjemputan === 'Selesai' && <span className="text-green-600 font-bold">(Sampai)</span>}
                              </span>
                          )}
                          <span className="font-semibold text-gray-800">
                             {don.jenis_donasi === 'Uang' ? `Rp ${Number(don.nominal).toLocaleString('id-ID')}` : don.nama_barang}
                          </span>
                       </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(don.status)}`}>
                        {don.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleViewDetail(don)} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada data donasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DETAIL --- */}
      {showDetailModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowDetailModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Detail Donasi #{selectedDonation.id_donasi}</h2>
            
            <div className="space-y-4 text-sm">
                
                {/* 1. Donatur Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                   <h3 className="font-semibold text-gray-700 mb-2">Informasi Donatur</h3>
                   <div className="grid grid-cols-1 gap-2">
                       <div className="flex justify-between">
                           <span className="text-gray-500">Nama:</span>
                           <span className="font-medium">{selectedDonation.nama_donatur}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500 flex items-center gap-1"><Phone size={14}/> No. Telepon:</span>
                           <div className="flex items-center gap-2">
                               {isEditingPhone ? (
                                   <div className="flex items-center gap-1">
                                       <input type="text" className="border border-blue-400 rounded px-2 py-1 text-xs w-32 focus:outline-none" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}/>
                                       <button onClick={handleSavePhone} disabled={isSavingPhone} className="bg-green-600 text-white p-1 rounded hover:bg-green-700">{isSavingPhone ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}</button>
                                       <button onClick={() => setIsEditingPhone(false)} className="bg-gray-300 text-gray-700 p-1 rounded hover:bg-gray-400"><X size={14}/></button>
                                   </div>
                               ) : (
                                   <div className="flex items-center gap-2">
                                       <span className="font-medium">{selectedDonation.no_telp || '-'}</span>
                                       <button onClick={() => setIsEditingPhone(true)} className="text-blue-600 hover:text-blue-800" title="Ubah Nomor"><Edit2 size={14}/></button>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
                </div>

                {/* 2. Detail Data */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs">Program</p>
                        <p className="font-semibold">{selectedDonation.nama_program || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Tanggal</p>
                        <p className="font-semibold">{new Date(selectedDonation.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Jenis</p>
                        <p className="font-semibold">{selectedDonation.jenis_donasi}</p>
                    </div>
                    
                    {selectedDonation.jenis_donasi === 'Uang' ? (
                       <div>
                          <p className="text-gray-500 text-xs">Nominal</p>
                          <p className="font-bold text-green-600">Rp {Number(selectedDonation.nominal).toLocaleString('id-ID')}</p>
                       </div>
                    ) : (
                       <div>
                          <p className="text-gray-500 text-xs">Barang</p>
                          <p className="font-bold">{selectedDonation.nama_barang}</p>
                       </div>
                    )}
                </div>

                {/* 3. LOGIKA BARANG (UPDATE STATUS LOGISTIK) */}
                {selectedDonation.jenis_donasi === 'Barang' && (
                    <div className="mt-4 border border-blue-200 bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-800"><Truck size={16}/> Update Status Barang</h3>
                        
                        {/* Status Saat Ini */}
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-xs text-gray-600">Status Saat Ini:</p>
                             <span className={`text-xs font-bold px-2 py-0.5 rounded border ${selectedDonation.status_penjemputan === 'Selesai' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300'}`}>
                                 {selectedDonation.status_penjemputan || 'Belum Sampai / Dijadwalkan'}
                             </span>
                        </div>
                        
                        {/* -- INPUT AREA BERDASARKAN METODE -- */}
                        <div className="flex gap-2 items-end">
                             <div className="flex-1">
                                 <label className="text-[10px] text-gray-500 block mb-1">
                                     {selectedDonation.metode_pengiriman === 'Pick-up' ? 'Update Tracking Driver:' : 'Update Penerimaan Barang (Self-Deliv):'}
                                 </label>
                                 
                                 <select 
                                    className="border p-2 rounded w-full text-sm bg-white"
                                    value={selectedDonation.status_penjemputan || (selectedDonation.metode_pengiriman === 'Pick-up' ? 'Dijadwalkan' : 'Belum Sampai')}
                                    onChange={(e) => handleUpdateDeliveryStatus(e.target.value)}
                                    disabled={isUpdatingDelivery}
                                 >
                                     {/* Opsi Untuk Pick-up */}
                                     {selectedDonation.metode_pengiriman === 'Pick-up' && (
                                         <>
                                            <option value="Dijadwalkan">Dijadwalkan</option>
                                            <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                                            <option value="Selesai">Selesai (Sampai)</option>
                                            <option value="Batal">Batal</option>
                                         </>
                                     )}

                                     {/* Opsi Untuk Self-Delivery */}
                                     {selectedDonation.metode_pengiriman === 'Self-Delivery' && (
                                         <>
                                            <option value="Belum Sampai">Belum Sampai</option>
                                            <option value="Selesai">Sudah Sampai di Yayasan</option>
                                         </>
                                     )}
                                 </select>
                             </div>
                             {isUpdatingDelivery && <Loader2 className="animate-spin text-blue-600 mb-2"/>}
                        </div>

                        {/* Info Resi jika Self-Delivery */}
                        {selectedDonation.metode_pengiriman === 'Self-Delivery' && (
                            <div className="mt-3 bg-white p-2 rounded border">
                                <p className="text-[10px] text-gray-500 uppercase">Info Donatur (Resi)</p>
                                <p className="font-mono text-sm font-bold text-gray-700">{selectedDonation.nomor_resi || 'Resi tidak diinput'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button onClick={() => setShowDetailModal(false)} className="mt-6 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}