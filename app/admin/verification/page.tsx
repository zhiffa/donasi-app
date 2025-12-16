'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, Loader2, X, CreditCard, Package, Truck, AlertTriangle, MapPin } from 'lucide-react'

// Interface Data
interface DonationRow {
  id_donasi: number;
  nama_donatur: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  metode_pembayaran: string | null;
  metode_pengiriman: string | null;
  nomor_resi: string | null;
  rejection_reason: string | null;
  status: 'Pending' | 'Diterima' | 'Ditolak';
  created_at: string;
  status_logistik: string | null; // Field ini terisi 'Selesai' jika Admin Manajemen sudah update
}

export default function DonationVerificationPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  // Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/verification');
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data: DonationRow[] = await res.json();
      setDonations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDonations(); }, []);

  const queueData = donations.filter(d => d.status === 'Pending');
  const historyData = donations.filter(d => d.status !== 'Pending');
  const currentData = activeTab === 'queue' ? queueData : historyData;

  const handleOpenModal = (don: DonationRow) => {
    setSelectedDonation(don);
    setRejectReasonInput('');
    setShowDetailModal(true);
  };

  const handleVerificationAction = async (status: 'Diterima' | 'Ditolak') => {
    if (!selectedDonation) return;

    // --- LOGIKA PERINGATAN LOGISTIK (UPDATED) ---
    // Berlaku untuk Pick-up MAUPUN Self-Delivery.
    // Jika Admin Manajemen belum set status ke 'Selesai', beri peringatan keras.
    if (status === 'Diterima' 
        && selectedDonation.jenis_donasi === 'Barang' 
        && selectedDonation.status_logistik !== 'Selesai') {
        
        const confirmForce = confirm(
            `PERINGATAN QC:\n` +
            `Sistem mencatat barang ini BELUM SAMPAI di yayasan (Status: ${selectedDonation.status_logistik || 'Belum diupdate'}).\n\n` +
            `Admin Manajemen harus mengupdate status menjadi 'Sudah Sampai' terlebih dahulu.\n` +
            `Apakah Anda yakin fisik barang SUDAH ADA di depan Anda dan ingin memaksa verifikasi?`
        );
        if (!confirmForce) return;
    } else {
        // Konfirmasi standar
        if (!confirm(`Konfirmasi: ${status} donasi ini?`)) return;
    }
    // ---------------------------------------------

    if (status === 'Ditolak' && !rejectReasonInput.trim()) {
        alert('Mohon isi alasan penolakan.');
        return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/verification/${selectedDonation.id_donasi}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status: status,
            reason: status === 'Ditolak' ? rejectReasonInput : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(data.message);
      setShowDetailModal(false);
      fetchDonations();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper render status logistik (Badge)
  const renderLogisticsBadge = (status: string | null) => {
      // Jika status 'Selesai', artinya barang sudah diterima Admin Manajemen (Baik Pick-up atau Self-Deliv)
      if (status === 'Selesai') {
          return (
             <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-200 flex items-center gap-1 w-fit">
                <CheckCircle size={10}/> Sudah Sampai
             </span>
          );
      }
      // Jika belum selesai
      return (
         <span className="bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-yellow-200 w-fit">
            {status || 'Belum Sampai'}
         </span>
      );
  };

  const renderInfoColumn = (don: DonationRow) => {
    if (don.jenis_donasi === 'Uang') {
        return (
            <div className="flex flex-col">
                <span className="font-bold text-green-600">Rp {Number(don.nominal).toLocaleString('id-ID')}</span>
                <span className="text-xs text-gray-500">{don.metode_pembayaran || 'Manual'}</span>
            </div>
        );
    } else {
        return (
            <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-800 text-sm">{don.nama_barang}</span>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        {don.metode_pengiriman === 'Pick-up' ? <Truck size={10}/> : <Package size={10}/>}
                        {don.metode_pengiriman}
                    </span>
                    {/* Tampilkan Badge Logistik untuk SEMUA metode pengiriman barang */}
                    {renderLogisticsBadge(don.status_logistik)}
                </div>
            </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Verifikasi & QC Donasi</h1>

      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab('queue')} className={`px-6 py-3 font-medium text-sm border-b-2 ${activeTab === 'queue' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Antrean Verifikasi <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">{queueData.length}</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-medium text-sm border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Riwayat
        </button>
      </div>

      {isLoading && <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded">{error}</div>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis & Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length > 0 ? (
                currentData.map((don) => (
                  <tr key={don.id_donasi} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{don.nama_donatur}</td>
                    <td className="px-6 py-4 text-sm">{renderInfoColumn(don)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(don.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${don.status === 'Diterima' ? 'bg-green-100 text-green-800' : 
                          don.status === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {don.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                        <button onClick={() => handleOpenModal(don)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 transition">
                             <Eye size={14}/> {don.status === 'Pending' ? 'Periksa' : 'Detail'}
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DETAIL --- */}
      {showDetailModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-lg font-bold text-gray-800">
                    {selectedDonation.status === 'Pending' ? 'Verifikasi Donasi' : 'Detail Donasi'}
                </h2>
                <button onClick={() => setShowDetailModal(false)}><X size={20} className="text-gray-500 hover:text-gray-800"/></button>
            </div>

            <div className="p-6 space-y-4">
                {/* Info Umum */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 text-xs">Nama Donatur</p>
                        <p className="font-semibold">{selectedDonation.nama_donatur}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Jenis Donasi</p>
                        <span className="font-bold">{selectedDonation.jenis_donasi}</span>
                    </div>
                </div>

                {/* Detail Uang / Barang */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    {selectedDonation.jenis_donasi === 'Uang' ? (
                        <>
                           <p className="text-xs text-gray-500">Nominal & Metode</p>
                           <p className="text-xl font-bold text-green-600">Rp {Number(selectedDonation.nominal).toLocaleString('id-ID')}</p>
                           <p className="text-sm mt-1">{selectedDonation.metode_pembayaran || 'Manual'}</p>
                        </>
                    ) : (
                        <>
                           <p className="text-xs text-gray-500">Nama Barang</p>
                           <p className="text-lg font-bold text-gray-800 mb-2">{selectedDonation.nama_barang}</p>
                           
                           <div className="border-t border-gray-200 pt-2 mt-2">
                               <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                   <MapPin size={12}/> Status Pengiriman / Logistik
                               </p>
                               
                               {/* === LOGIKA VISUAL STATUS LOGISTIK (UPDATED) === */}
                               <div className="flex items-center justify-between bg-white p-2 rounded border">
                                   <div className="flex flex-col">
                                       <span className="text-xs text-gray-600">
                                           {selectedDonation.metode_pengiriman === 'Pick-up' ? 'Layanan Jemput' : 'Antar Sendiri (Self-Delivery)'}
                                       </span>
                                       {selectedDonation.metode_pengiriman === 'Self-Delivery' && (
                                            <span className="text-[10px] text-gray-400">Resi: {selectedDonation.nomor_resi || '-'}</span>
                                       )}
                                   </div>

                                   {/* Indikator Status (Sama untuk semua metode) */}
                                   {selectedDonation.status_logistik === 'Selesai' ? (
                                       <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                           <CheckCircle size={14}/>
                                           <span className="text-xs font-bold">Barang Sudah Sampai</span>
                                       </div>
                                   ) : (
                                       <div className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                           <Truck size={14}/>
                                           <span className="text-xs font-bold">{selectedDonation.status_logistik || 'Belum Sampai'}</span>
                                       </div>
                                   )}
                               </div>
                               {/* ============================================= */}
                           </div>
                        </>
                    )}
                </div>

                {/* Area Aksi */}
                {selectedDonation.status === 'Pending' && selectedDonation.metode_pembayaran !== 'Midtrans' && (
                    <div className="pt-4 border-t mt-4">
                        <p className="font-bold text-gray-800 mb-2">Keputusan Verifikasi</p>
                        
                        {/* Pesan Peringatan jika barang belum sampai (Untuk SEMUA metode) */}
                        {selectedDonation.jenis_donasi === 'Barang' && selectedDonation.status_logistik !== 'Selesai' && (
                             <div className="bg-orange-50 p-2 rounded border border-orange-200 mb-3 text-xs text-orange-800 flex items-start gap-2">
                                 <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                                 <span>
                                     <strong>Perhatian QC:</strong> Status logistik barang ini masih "{selectedDonation.status_logistik || 'Belum diupdate'}".
                                     <br/>Pastikan Admin Manajemen sudah mengupdate status menjadi "Sudah Sampai" sebelum Anda menerima donasi ini.
                                 </span>
                             </div>
                        )}

                        <div className="flex gap-3 mb-3">
                             <button onClick={() => handleVerificationAction('Ditolak')} disabled={isProcessing} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded font-medium flex justify-center items-center gap-2">
                                <XCircle size={18}/> Tolak
                             </button>
                             <button onClick={() => handleVerificationAction('Diterima')} disabled={isProcessing} className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2 rounded font-medium flex justify-center items-center gap-2">
                                {isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>}
                                Terima Barang
                             </button>
                        </div>
                        <div>
                            <textarea className="w-full border rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-red-200 outline-none" rows={2} placeholder="Alasan (Wajib jika menolak)..." value={rejectReasonInput} onChange={(e) => setRejectReasonInput(e.target.value)}/>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}