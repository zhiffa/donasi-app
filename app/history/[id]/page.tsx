'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, FileText, Truck, MapPin, Package, Calendar, Phone } from 'lucide-react'

// Impor komponen Live Reports
import DonasiMasuk from '@/components/DonasiMasuk'
import PengeluaranDana from '@/components/PengeluaranDana'

interface DonationDetail {
  id_donasi: number;
  id_kegiatan: number;
  nama_program: string;
  created_at: string;
  jenis_donasi: 'Uang' | 'Barang';
  nominal: number | null;
  nama_barang: string | null;
  deskripsi_barang: string | null;
  status: string;
  rejection_reason: string | null; 
  metode_pengiriman: string | null;
  nomor_resi: string | null;
  phone_donatur?: string; 
  jadwal?: {
    status_penjemputan: string; 
    alamat_penjemputan: string;
    tanggal_penjemputan?: string; 
    jam_penjemputan?: string;    
  }
}

export default function DonationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [detail, setDetail] = useState<DonationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resiInput, setResiInput] = useState('');
  const [isSavingResi, setIsSavingResi] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/history/detail/${params.id}`);
        if (!res.ok) throw new Error('Gagal memuat detail');
        const data = await res.json();
        setDetail(data);
      } catch (err) {
        console.error(err);
        alert('Gagal memuat data donasi');
        router.push('/history');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id, router]);

  const handleSaveResi = async () => {
    if(!resiInput) return;
    setIsSavingResi(true);
    try {
        const res = await fetch('/api/donasi/resi', {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ donationId: detail?.id_donasi, resi: resiInput })
        });
        if(res.ok) {
            alert('Resi tersimpan');
            window.location.reload();
        } else {
            alert('Gagal menyimpan resi');
        }
    } catch (e) {
        console.error(e);
        alert('Terjadi kesalahan saat menyimpan resi');
    } finally { 
        setIsSavingResi(false); 
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;
  if (!detail) return null;

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch (e) { return dateString; }
  };

  // --- LOGIC TRACKING STATUS ---
  const renderTracking = () => {
      
      // 1. JIKA DONASI UANG
      if (detail.jenis_donasi === 'Uang') {
          return (
              <div className="bg-white p-6 rounded-xl border mb-6 shadow-sm">
                  <h3 className="font-bold mb-4 text-gray-800">Status Donasi</h3>
                  <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${detail.status === 'Diterima' ? 'bg-green-100 text-green-600' : detail.status === 'Ditolak' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {detail.status === 'Diterima' ? <CheckCircle className="w-6 h-6"/> : detail.status === 'Ditolak' ? <XCircle className="w-6 h-6"/> : <Clock className="w-6 h-6"/>}
                      </div>
                      <div>
                          <p className={`font-bold text-lg ${detail.status === 'Diterima' ? 'text-green-700' : detail.status === 'Ditolak' ? 'text-red-700' : 'text-yellow-700'}`}>{detail.status}</p>
                          <p className="text-gray-500 text-xs mt-1">Donasi Uang</p>
                      </div>
                  </div>
              </div>
          );
      }

      // 2. JIKA BARANG - SELF DELIVERY (UPDATED)
      if (detail.metode_pengiriman === 'Self-Delivery') {
          const steps = ['Menunggu Resi', 'Dalam Pengiriman', 'Sampai di Yayasan'];
          
          let currentIdx = 0;
          if (detail.nomor_resi) currentIdx = 1;
          
          // --- LOGIKA BARU: Cek data Jadwal dari API ---
          if (
              (detail.jadwal && detail.jadwal.status_penjemputan === 'Selesai') || 
              detail.status === 'Diterima'
          ) {
              currentIdx = 2;
          }

          return (
            <div className="bg-white p-6 rounded-xl border mb-6 shadow-sm">
                <h3 className="font-bold mb-6 text-gray-800 flex items-center gap-2">
                   <Package className="w-5 h-5 text-blue-600"/> Lacak Paket (Self-Delivery)
                </h3>

                <div className="relative flex justify-between items-center mb-8 mx-2">
                   <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
                   <div 
                     className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-700 ease-out" 
                     style={{width: `${(currentIdx / (steps.length-1)) * 100}%`}}
                   ></div>

                   {/* Step 1 */}
                   <div className="text-center bg-white px-1">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${currentIdx >= 0 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                           <FileText size={14}/>
                       </div>
                       <p className={`text-[10px] font-bold ${currentIdx >= 0 ? 'text-gray-900' : 'text-gray-400'}`}>Input Resi</p>
                   </div>
                   {/* Step 2 */}
                   <div className="text-center bg-white px-1">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${currentIdx >= 1 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                           <Truck size={14}/>
                       </div>
                       <p className={`text-[10px] font-bold ${currentIdx >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Dikirim</p>
                   </div>
                   {/* Step 3 */}
                   <div className="text-center bg-white px-1">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${currentIdx >= 2 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                           <CheckCircle size={14}/>
                       </div>
                       <p className={`text-[10px] font-bold ${currentIdx >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Sampai</p>
                   </div>
                </div>

                {!detail.nomor_resi && currentIdx < 2 && detail.status === 'Pending' && (
                   <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                       <label className="text-sm font-bold block mb-2 text-blue-800">Sudah kirim barang? Masukkan Resi:</label>
                       <div className="flex gap-2">
                           <input 
                             value={resiInput} 
                             onChange={e=>setResiInput(e.target.value)} 
                             className="border border-gray-300 p-2 rounded-lg w-full text-sm outline-none" 
                             placeholder="Contoh: JNE123456"
                           />
                           <button onClick={handleSaveResi} disabled={isSavingResi || !resiInput} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                               {isSavingResi ? '...' : 'Simpan'}
                           </button>
                       </div>
                   </div>
                )}

                {detail.nomor_resi && (
                   <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                       <div>
                           <p className="text-xs text-gray-500 uppercase font-bold">Nomor Resi</p>
                           <p className="text-gray-800 font-mono text-sm font-bold">{detail.nomor_resi}</p>
                       </div>
                       <div className="text-right">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${currentIdx === 2 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                               {currentIdx === 2 ? 'Barang Diterima' : 'Dalam Pengiriman'}
                           </span>
                       </div>
                   </div>
                )}
                
                {currentIdx === 2 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle size={18} className="shrink-0"/>
                        <p>Barang fisik sudah kami terima di yayasan. Terima kasih!</p>
                    </div>
                )}
            </div>
          );
      }

      // 3. JIKA BARANG - PICK UP
      if (detail.metode_pengiriman === 'Pick-up' && detail.jadwal) {
          const steps = ['Dijadwalkan', 'Dalam Perjalanan', 'Selesai']; 
          
          let currentIdx = steps.indexOf(detail.jadwal.status_penjemputan);
          if (detail.status === 'Diterima') currentIdx = 2; 
          if (currentIdx === -1) currentIdx = 0; 

          return (
              <div className="bg-white p-6 rounded-xl border mb-6 shadow-sm">
                  <h3 className="font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600"/> Lacak Penjemputan
                  </h3>
                  
                  <div className="relative flex justify-between items-center mb-8 mx-2">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
                      <div 
                        className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-700 ease-out" 
                        style={{width: `${(currentIdx / (steps.length-1)) * 100}%`}}
                      ></div>

                      <div className="text-center bg-white px-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${currentIdx >= 0 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                            <Clock size={14}/>
                          </div>
                          <p className={`text-[10px] font-bold ${currentIdx >= 0 ? 'text-gray-900' : 'text-gray-400'}`}>Menunggu</p>
                      </div>

                      <div className="text-center bg-white px-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${currentIdx >= 1 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                            <Truck size={14}/>
                          </div>
                          <p className={`text-[10px] font-bold ${currentIdx >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Dijemput</p>
                      </div>

                      <div className="text-center bg-white px-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${currentIdx >= 2 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                            <MapPin size={14}/>
                          </div>
                          <p className={`text-[10px] font-bold ${currentIdx >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Sampai</p>
                      </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                             <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                             <div>
                                 <p className="text-xs text-blue-600 font-bold uppercase mb-1">Jadwal Penjemputan</p>
                                 <p className="text-sm font-semibold text-gray-800">
                                     {formatDateOnly(detail.jadwal.tanggal_penjemputan)}
                                 </p>
                                 <p className="text-sm text-gray-600 mt-1">
                                     Pukul: <span className="font-medium text-gray-900">{detail.jadwal.jam_penjemputan || '-'}</span>
                                 </p>
                             </div>
                        </div>
                  </div>
              </div>
          );
      }
      
      return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-5xl">
        
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium transition">
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Riwayat
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Detail Donasi #{detail.id_donasi}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLOM KIRI: STATUS & TRACKING */}
            <div className="lg:col-span-1 space-y-6">
                
                {renderTracking()}

                {/* Kartu Rincian Donasi */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4 text-gray-800 border-b pb-2">Rincian Donasi</h3>
                    
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Program</span>
                            <span className="font-medium text-right w-1/2">{detail.nama_program}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-gray-500 flex items-center gap-1"><Phone size={14}/> Kontak</span>
                            <span className="font-medium text-right">{detail.phone_donatur || '-'}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Jenis</span>
                            <span className="font-medium capitalize bg-gray-100 px-2 py-0.5 rounded">{detail.jenis_donasi}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Jumlah</span>
                            <span className="font-bold text-blue-600 text-lg">
                                {detail.jenis_donasi === 'Uang' 
                                    ? `Rp ${Number(detail.nominal).toLocaleString('id-ID')}` 
                                    : detail.nama_barang}
                            </span>
                        </div>
                        {detail.deskripsi_barang && (
                             <div className="pt-2">
                                <span className="text-gray-500 block mb-1 text-xs uppercase font-bold">Detail Barang:</span>
                                <p className="bg-gray-50 p-3 rounded text-gray-700 italic border">{detail.deskripsi_barang}</p>
                             </div>
                        )}
                        
                        {/* Status Verifikasi */}
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <span className="text-gray-500 font-bold">Status Verifikasi</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${detail.status === 'Diterima' ? 'bg-green-100 text-green-700' : detail.status === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {detail.status}
                            </span>
                        </div>
                        {detail.status === 'Ditolak' && detail.rejection_reason && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2 border border-red-100">Alasan: {detail.rejection_reason}</p>
                        )}
                    </div>

                    {detail.status === 'Diterima' && (
                        <div className="mt-8 pt-4 border-t">
                            <Link 
                                href={`/history/receipt/${detail.id_donasi}`}
                                target="_blank"
                                className="flex items-center justify-center w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                            >
                                <FileText className="mr-2 h-5 w-5" />
                                Lihat Tanda Terima
                            </Link>
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                Dokumen resmi yayasan (PDF)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* KOLOM KANAN: LIVE REPORTS */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Transparansi Program</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Laporan donasi masuk dan penggunaan dana untuk program ini secara keseluruhan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                         <DonasiMasuk programId={detail.id_kegiatan.toString()} />
                         <PengeluaranDana programId={detail.id_kegiatan.toString()} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}