'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, LogIn, MapPin, Truck, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import dynamic from 'next/dynamic'

// Load MapPicker di Client-side saja
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded flex items-center justify-center">Memuat Peta...</div>
})

// --- TIPE DATA ---
type DonationType = 'uang' | 'barang' | null
type DonationStep = 'initialForm' | 'donationConfirmation' | 'deliveryOptions' | 'selfDeliveryInfo' | 'pickupDetails' | 'paymentOptions' | 'finalSummary'
type DeliveryMethod = 'self' | 'pickup' | null

interface GoodItem { id: number; jenis: string; jumlah: string; }
interface DonationPageParams { programId: string; }
interface User { id_user: number; nama: string; email: string; phone: string; role: 'admin' | 'donatur'; }

// --- HELPER FUNCTIONS ---
const PICKUP_TIMES = ['08:00 - 10:00', '13:00 - 15:00', '16:00 - 19:00'];

const getNextPickupDates = () => {
  const dates: Date[] = [];
  const date = new Date();
  date.setDate(date.getDate() + 1); 
  while (dates.length < 6) {
    const day = date.getDay(); 
    if (day === 1 || day === 3 || day === 5) dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const formatDateValue = (date: Date) => {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const formatDateDisplay = (date: Date) => date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


export default function DonationFormPage({ params }: { params: DonationPageParams }) {
  const router = useRouter();

  // --- STATE ---
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<User | null>(null);
  
  // Form State
  const [donationStep, setDonationStep] = useState<DonationStep>('initialForm');
  const [donationType, setDonationType] = useState<DonationType>(null);
  const [samarkanNama, setSamarkanNama] = useState(false);
  const [nominal, setNominal] = useState('');
  const [goods, setGoods] = useState<GoodItem[]>([{ id: Date.now(), jenis: '', jumlah: '' }]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(null);
  
  // Pickup States
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Result State
  const [createdDonationId, setCreatedDonationId] = useState<number | null>(null);
  const [resiInput, setResiInput] = useState('');
  const [isSubmittingResi, setIsSubmittingResi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- EFFECTS ---
  useEffect(() => { setAvailableDates(getNextPickupDates()); }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not logged in');
        const data = await res.json();
        setUser(data.user);
        setAuthStatus('authenticated');
      } catch (error) {
        setAuthStatus('unauthenticated');
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // --- HANDLERS ---
  const handleAddGood = () => { setGoods([...goods, { id: Date.now(), jenis: '', jumlah: '' }]); };
  const handleRemoveGood = (id: number) => { if (goods.length > 1) setGoods(goods.filter(g => g.id !== id)); };
  const handleGoodChange = (id: number, field: any, val: any) => { setGoods(goods.map(g => g.id === id ? { ...g, [field]: val } : g)); };
  
  // 1. Submit Form Awal (Pilih Tipe)
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationType) return alert('Pilih jenis donasi.');
    if (donationType === 'uang' && !nominal) return alert('Masukkan nominal.');
    
    // REVISI: Semua tipe masuk ke konfirmasi dulu
    setDonationStep('donationConfirmation');
  };

  // 2. Submit Konfirmasi (Preview)
  const handleConfirmationSubmit = () => {
    if (donationType === 'uang') {
        // Jika uang, trigger pembayaran sekarang
        submitDonation('uang');
    } else {
        // Jika barang, lanjut ke opsi pengiriman
        setDonationStep('deliveryOptions'); 
    }
  };
  
  // 3. Submit Opsi Pengiriman
  const handleDeliverySubmit = (e: React.FormEvent) => { 
      e.preventDefault();
      if (!deliveryMethod) return alert('Pilih metode pengiriman.');
      
      if (deliveryMethod === 'pickup') {
          setDonationStep('pickupDetails');
      } else {
          setDonationStep('selfDeliveryInfo'); 
      }
  };

  // 4. Submit Self Delivery
  const handleSelfDeliveryConfirm = () => {
      submitDonation('barang_self');
  };

  // 5. Submit Pickup
  const handlePickupSubmit = (e: React.FormEvent) => { 
      e.preventDefault();
      if (!pickupAddress || !pickupDate || !pickupTimeSlot) return alert('Lengkapi detail penjemputan.');
      submitDonation('barang_pickup');
  };

  // --- CORE SUBMIT LOGIC ---
  const submitDonation = async (flowType: string) => {
    setIsSubmitting(true);

    let apiDeliveryMethod = null;
    if (donationType === 'barang') {
      if (flowType === 'barang_self') apiDeliveryMethod = 'Self-Delivery';
      else if (flowType === 'barang_pickup') apiDeliveryMethod = 'Pick-up';
    }

    const payload = {
      programId: params.programId,
      samarkanNama,
      donationType,
      nominal: donationType === 'uang' ? parseFloat(nominal) : undefined,
      goods: donationType === 'barang' ? goods : undefined,
      deliveryMethod: apiDeliveryMethod,
      // Data Pickup
      pickupAddress: pickupAddress || undefined,
      pickupDate: pickupDate || undefined,
      pickupTimeSlot: pickupTimeSlot || undefined,
      pickupNotes: pickupNotes || undefined,
      pickupLat: pickupCoords?.lat,
      pickupLng: pickupCoords?.lng
    };

    try {
      const res = await fetch('/api/donasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCreatedDonationId(data.donationId);

      if (donationType === 'uang' && data.snapToken) {
        // @ts-ignore
        window.snap.pay(data.snapToken, {
          onSuccess: () => { setDonationStep('finalSummary'); setIsSubmitting(false); },
          onPending: () => { setDonationStep('finalSummary'); setIsSubmitting(false); },
          onError: () => { alert("Pembayaran gagal!"); setIsSubmitting(false); },
          onClose: () => { alert('Popup ditutup. Silakan bayar melalui Riwayat Donasi jika belum selesai.'); setIsSubmitting(false); }
        });
      } else {
        setDonationStep('finalSummary');
        setIsSubmitting(false);
      }

    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Handler Resi
  const handleSubmitResi = async () => {
    if (!resiInput || !createdDonationId) return;
    setIsSubmittingResi(true);
    try {
        const res = await fetch('/api/donasi/resi', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donationId: createdDonationId, resi: resiInput })
        });
        if (res.ok) {
            alert('Nomor Resi berhasil disimpan!');
            setResiInput('');
        } else {
            alert('Gagal menyimpan resi.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmittingResi(false);
    }
  };

  // --- RENDER ---
  if (authStatus === 'loading') return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin"/></div>;
  if (authStatus === 'unauthenticated') return (
      <div className="h-screen flex flex-col justify-center items-center p-4 text-center">
          <LogIn className="h-12 w-12 mb-4 text-blue-500"/>
          <p className="mb-4">Anda harus login untuk berdonasi.</p>
          <button onClick={() => router.push(`/login?redirect=/donate/${params.programId}`)} className="bg-blue-600 text-white px-6 py-2 rounded-full">Login</button>
      </div>
  );

  return (
    <>
      <Script src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL} data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="lazyOnload"/>

      <div className="bg-gray-50 min-h-screen py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden min-h-[90vh] bg-white">
            
            {/* Sidebar Image */}
            <div className="relative hidden md:block bg-blue-50">
                <Image
                  src="/login.jpg"
                  alt="Ilustrasi Donasi"
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x800?text=Donasi'; }}
                />
            </div>

            {/* Main Content */}
            <div className="bg-white p-8 md:p-10 lg:p-12 overflow-y-auto relative">
                {isSubmitting && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-lg font-semibold text-gray-700">Memproses...</p>
                    </div>
                )}

                {/* STEP 1: INITIAL FORM */}
                {donationStep === 'initialForm' && (
                    <form onSubmit={handleInitialSubmit} className="w-full">
                        <h1 className="mb-6 text-3xl font-bold text-gray-900">Formulir Donasi</h1>
                        
                        <div className="mb-6 border-b pb-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Donasi sebagai:</p>
                            <p className="rounded-md border border-gray-200 bg-gray-50 p-3 mb-2"><strong>{user?.nama}</strong></p>
                            <div className="flex items-center">
                                <input type="checkbox" id="samarkan" checked={samarkanNama} onChange={(e) => setSamarkanNama(e.target.checked)} className="h-4 w-4"/>
                                <label htmlFor="samarkan" className="ml-2 text-sm text-gray-600">Samarkan nama saya (Hamba Allah)</label>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <label className={`flex-1 cursor-pointer border-2 p-4 rounded-lg text-center ${donationType === 'uang' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" name="type" value="uang" checked={donationType === 'uang'} onChange={() => setDonationType('uang')} className="hidden"/> Uang
                            </label>
                            <label className={`flex-1 cursor-pointer border-2 p-4 rounded-lg text-center ${donationType === 'barang' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" name="type" value="barang" checked={donationType === 'barang'} onChange={() => setDonationType('barang')} className="hidden"/> Barang
                            </label>
                        </div>

                        {donationType === 'uang' && (
                            <div className="mb-6">
                                <label className="block mb-2 font-medium">Nominal (Rp)</label>
                                <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="50000" required />
                            </div>
                        )}
                        
                        {donationType === 'barang' && (
                            <div className="mb-6">
                                <label className="block mb-2 font-medium">Detail Barang</label>
                                {goods.map((g, i) => (
                                    <div key={g.id} className="flex gap-2 mb-2">
                                        <input placeholder="Jenis (mis: Baju)" value={g.jenis} onChange={(e) => handleGoodChange(g.id, 'jenis', e.target.value)} className="flex-1 border p-2 rounded" required/>
                                        <input placeholder="Jml" value={g.jumlah} onChange={(e) => handleGoodChange(g.id, 'jumlah', e.target.value)} className="w-1/3 border p-2 rounded" required/>
                                        {goods.length > 1 && <button type="button" onClick={() => handleRemoveGood(g.id)} className="text-red-500"><Trash2/></button>}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddGood} className="text-blue-600 text-sm">+ Tambah Barang</button>
                            </div>
                        )}
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition">Lanjut</button>
                    </form>
                )}

                {/* STEP 2: CONFIRMATION (REVISI: Support Uang & Barang) */}
                {donationStep === 'donationConfirmation' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center">Konfirmasi Donasi</h2>
                        
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                            {/* Info Umum */}
                            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                <span className="text-gray-600">Jenis Donasi</span>
                                <span className="font-bold capitalize text-gray-800">{donationType}</span>
                            </div>

                            {/* Tampilan Khusus UANG */}
                            {donationType === 'uang' && (
                                <>
                                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                        <span className="text-gray-600">Nominal</span>
                                        <span className="font-bold text-xl text-blue-600">
                                            Rp {parseInt(nominal || '0').toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Nama Donatur</span>
                                        <span className="font-medium text-gray-800">
                                            {samarkanNama ? 'Hamba Allah (Disamarkan)' : user?.nama}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* Tampilan Khusus BARANG */}
                            {donationType === 'barang' && (
                                <div>
                                    <p className="text-gray-600 mb-2">Daftar Barang:</p>
                                    <ul className="list-disc ml-5 space-y-1">
                                        {goods.map(g => (
                                            <li key={g.id} className="font-medium text-gray-800">
                                                {g.jenis} <span className="text-gray-500 text-sm">({g.jumlah})</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600">Nama Donatur</span>
                                        <span className="font-medium text-gray-800">
                                            {samarkanNama ? 'Hamba Allah (Disamarkan)' : user?.nama}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setDonationStep('initialForm')} 
                                className="flex-1 border border-gray-300 py-3 rounded-full hover:bg-gray-100 transition"
                            >
                                Kembali
                            </button>
                            <button 
                                onClick={handleConfirmationSubmit} 
                                className="flex-1 bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg"
                            >
                                {donationType === 'uang' ? 'Bayar Sekarang' : 'Lanjut Pengiriman'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: DELIVERY METHOD */}
                {donationStep === 'deliveryOptions' && (
                    <form onSubmit={handleDeliverySubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold">Metode Pengiriman</h2>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${deliveryMethod === 'self' ? 'border-blue-600 bg-blue-50' : ''}`}>
                                <input type="radio" name="del" value="self" checked={deliveryMethod === 'self'} onChange={() => setDeliveryMethod('self')} /> Antar Sendiri
                            </label>
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${deliveryMethod === 'pickup' ? 'border-blue-600 bg-blue-50' : ''}`}>
                                <input type="radio" name="del" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} /> Pick-up (Dijemput)
                            </label>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full font-bold">Selanjutnya</button>
                        <button type="button" onClick={() => setDonationStep('donationConfirmation')} className="mt-4 w-full text-center text-sm text-gray-600 hover:underline">Kembali</button>
                    </form>
                )}

                {/* STEP 4A: SELF DELIVERY INFO */}
                {donationStep === 'selfDeliveryInfo' && (
                    <div className="space-y-6 text-center">
                        <h2 className="text-2xl font-bold">Informasi Pengantaran</h2>
                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                            <p className="text-gray-600 mb-2">Silakan kirim atau antar barang donasi ke:</p>
                            <p className="text-xl font-bold text-gray-800">YAYASAN SHINE IN SMILES</p>
                            <p className="text-gray-700">Jl. Kebaikan No. 123, Jakarta Pusat</p>
                            <p className="text-gray-700">Telp: 021-1234567</p>
                            <div className="mt-4 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                                <Truck className="inline w-4 h-4 mr-1"/> Buka Senin - Sabtu (08.00 - 17.00)
                            </div>
                        </div>
                        <button onClick={handleSelfDeliveryConfirm} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold">Saya Mengerti & Kirim Donasi</button>
                        <button onClick={() => setDonationStep('deliveryOptions')} className="block w-full mt-2 text-gray-500">Kembali</button>
                    </div>
                )}

                {/* STEP 4B: PICKUP DETAILS */}
                {donationStep === 'pickupDetails' && (
                    <form onSubmit={handlePickupSubmit} className="space-y-4">
                        <h2 className="text-2xl font-bold">Detail Penjemputan</h2>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Alamat Lengkap</label>
                            <textarea rows={2} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="w-full border p-3 rounded-lg" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium mb-1">Tanggal</label>
                                <select value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full border p-3 rounded-lg bg-white" required>
                                    <option value="" disabled>-- Pilih --</option>
                                    {availableDates.map(date => (<option key={formatDateValue(date)} value={formatDateValue(date)}>{formatDateDisplay(date)}</option>))}
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">Waktu</label>
                                <select value={pickupTimeSlot} onChange={(e) => setPickupTimeSlot(e.target.value)} className="w-full border p-3 rounded-lg bg-white" required>
                                    <option value="" disabled>-- Pilih --</option>
                                    {PICKUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Catatan untuk Penjemput (Opsional)</label>
                            <textarea rows={2} value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="Cth: Pagar warna hitam, bel rusak." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Tandai Lokasi (Opsional)</label>
                            <div className="border rounded-lg overflow-hidden">
                                <MapPicker onLocationSelect={(lat, lng) => setPickupCoords({lat, lng})} />
                            </div>
                            {pickupCoords && <p className="text-xs text-green-600 mt-1">Lokasi ditandai: {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}</p>}
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full font-bold mt-4">Konfirmasi Penjemputan</button>
                        <button type="button" onClick={() => setDonationStep('deliveryOptions')} className="mt-2 w-full text-center text-sm text-gray-600">Kembali</button>
                    </form>
                )}

                {/* STEP FINAL: SUMMARY */}
                {donationStep === 'finalSummary' && (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center"><CheckCircle className="w-16 h-16 text-green-500" /></div>
                        <h2 className="text-3xl font-bold text-green-600">Terima Kasih!</h2>
                        
                        {donationType === 'barang' && deliveryMethod === 'self' ? (
                            <div className="bg-blue-50 p-6 rounded-lg text-left space-y-4">
                                <p className="text-gray-800">Donasi barang Anda telah tercatat. Mohon segera kirimkan barang Anda.</p>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Sudah kirim? Masukkan Nomor Resi (Opsional)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={resiInput} 
                                            onChange={(e) => setResiInput(e.target.value)} 
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                                            placeholder="Contoh: JP1234567890"
                                        />
                                        <button 
                                            onClick={handleSubmitResi}
                                            disabled={isSubmittingResi || !resiInput}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold disabled:bg-gray-400"
                                        >
                                            {isSubmittingResi ? 'Simpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">*Anda juga bisa memasukkan nomor resi nanti di halaman Riwayat.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xl text-gray-700 font-medium">
                                {donationType === 'uang' ? 'Transaksi Anda sedang diproses.' : 'Penjemputan telah dijadwalkan.'}
                            </p>
                        )}
                        
                        <div className="space-y-3 pt-4">
                            <Link href="/history" className="block w-full bg-blue-600 text-white py-3 rounded-full font-bold">Cek Status & Riwayat</Link>
                            <button onClick={() => router.push('/')} className="block w-full border py-3 rounded-full">Ke Beranda</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </>
  )
}