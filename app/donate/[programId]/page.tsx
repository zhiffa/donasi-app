'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Tipe data
type DonationType = 'uang' | 'barang' | null
type DonationStep = 'initialForm' | 'donationConfirmation' | 'deliveryOptions' | 'pickupDetails' | 'paymentOptions' | 'finalSummary'
type DeliveryMethod = 'self' | 'pickup' | null
type PaymentMethod = 'ewallet' | 'va' | 'qris' | null

interface GoodItem {
  id: number;
  jenis: string;
  jumlah: string;
}
interface DonationPageParams {
  programId: string;
}
interface User {
  id_user: number;
  nama: string;
  email: string;
  phone: string;
  role: 'admin' | 'donatur';
}

// Opsi Jam Penjemputan
const PICKUP_TIMES = ['08:00 - 10:00', '13:00 - 15:00', '16:00 - 19:00'];

// --- LOGIKA BARU: Generate Tanggal Valid (Senin, Rabu, Jumat) ---
const getNextPickupDates = () => {
  const dates: Date[] = [];
  const date = new Date();
  date.setDate(date.getDate() + 1); // Mulai cek dari BESOK (H+1) agar admin punya waktu persiapan

  // Cari 6 opsi tanggal valid ke depan (kurang lebih untuk 2 minggu ke depan)
  while (dates.length < 6) {
    const day = date.getDay(); // 0=Minggu, 1=Senin, ... 6=Sabtu
    
    // Cek apakah hari ini Senin (1), Rabu (3), atau Jumat (5)
    if (day === 1 || day === 3 || day === 5) {
      dates.push(new Date(date));
    }
    // Lanjut ke hari berikutnya
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

// Format tanggal untuk dikirim ke Database (YYYY-MM-DD)
const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format tanggal untuk Tampilan User (Hari, DD Bulan YYYY)
const formatDateDisplay = (date: Date) => {
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};
// -----------------------------------------------------------

export default function DonationFormPage({ params }: { params: DonationPageParams }) {
  const router = useRouter();

  // --- State ---
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [donationStep, setDonationStep] = useState<DonationStep>('initialForm');
  const [donationType, setDonationType] = useState<DonationType>(null);
  const [samarkanNama, setSamarkanNama] = useState(false);
  const [nominal, setNominal] = useState('');
  const [goods, setGoods] = useState<GoodItem[]>([
    { id: Date.now(), jenis: '', jumlah: '' }
  ]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(null);
  
  // State Form Penjemputan
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');
  
  // State Opsi Tanggal (Diisi otomatis saat komponen dimuat)
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Effect: Generate Tanggal ---
  useEffect(() => {
    const dates = getNextPickupDates();
    setAvailableDates(dates);
  }, []);

  // --- Effect: Cek Login ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Not logged in');
        }
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

  // --- Handlers ---
  const handleAddGood = () => { setGoods([...goods, { id: Date.now(), jenis: '', jumlah: '' }]); };
  
  const handleRemoveGood = (idToRemove: number) => {
      if (goods.length > 1) {
        setGoods(goods.filter(good => good.id !== idToRemove));
      } else {
        alert("Minimal harus ada satu jenis barang.");
      }
  };

  const handleGoodChange = (id: number, field: 'jenis' | 'jumlah', value: string) => {
    setGoods(goods.map(good => good.id === id ? { ...good, [field]: value } : good));
  };
  
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationType) {
        alert('Pilih jenis donasi terlebih dahulu.');
        return;
    }
    if (donationType === 'barang' && goods.some(g => !g.jenis || !g.jumlah)) {
        alert('Pastikan semua detail barang terisi.');
        return;
    }
     if (donationType === 'uang' && !nominal) {
        alert('Masukkan nominal donasi.');
        return;
    }
    if (!user) {
        alert('Data pengguna tidak ditemukan, silakan refresh.');
        return;
    }
    setDonationStep('donationConfirmation');
  };

  const handleConfirmationSubmit = () => {
      if (donationType === 'uang') {
          setDonationStep('paymentOptions');
      } else if (donationType === 'barang') {
          setDonationStep('deliveryOptions');
      }
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!deliveryMethod) {
          alert('Pilih metode pengiriman.');
          return;
      }
      if (deliveryMethod === 'pickup') {
          setDonationStep('pickupDetails');
      } else {
          submitDonation('self'); 
      }
  };

   const handlePickupSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!pickupAddress || !pickupDate || !pickupTimeSlot) {
          alert('Lengkapi detail penjemputan.');
          return;
      }
      submitDonation('pickup');
   };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
        alert('Pilih metode pembayaran.');
        return;
    }
    submitDonation(null); 
  };

  // --- FUNGSI SUBMIT ---
  const submitDonation = async (finalDeliveryMethod: DeliveryMethod | null) => {
    setIsSubmitting(true);

    let apiDeliveryMethod = null;
    if (donationType === 'barang') {
      if (finalDeliveryMethod === 'self') apiDeliveryMethod = 'Self-Delivery';
      else if (finalDeliveryMethod === 'pickup') apiDeliveryMethod = 'Pick-up';
    }

    const payload = {
      programId: params.programId,
      samarkanNama: samarkanNama,
      donationType: donationType,
      nominal: donationType === 'uang' ? parseFloat(nominal) : undefined,
      paymentMethod: donationType === 'uang' ? paymentMethod : undefined,
      goods: donationType === 'barang' ? goods : undefined,
      deliveryMethod: apiDeliveryMethod,
      pickupAddress: pickupAddress || undefined,
      pickupDate: pickupDate || undefined,
      pickupTimeSlot: pickupTimeSlot || undefined,
    };

    try {
      const res = await fetch('/api/donasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim donasi');
      }

      setDonationStep('finalSummary');
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  if (authStatus === 'loading') {
    return (
        <div className="bg-gray-50 min-h-screen py-12 flex items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-600" />
        </div>
    );
  }

  if (authStatus === 'unauthenticated') {
     return (
        <div className="bg-gray-50 min-h-screen py-12 flex items-center justify-center">
            <div className="container mx-auto max-w-2xl text-center bg-white p-8 rounded-lg shadow-xl">
                 <LogIn className="h-12 w-12 mx-auto text-blue-600" />
                 <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-3">Anda Belum Login</h2>
                 <p className="text-gray-700 mb-6">Untuk melanjutkan donasi, silakan login atau buat akun terlebih dahulu.</p>
                 <div className="flex gap-4">
                     <button onClick={() => router.push(`/login?redirect=/donate/${params.programId}`)} className="flex-1 rounded-full bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700">Login / Register</button>
                     <button onClick={() => router.push('/')} className="flex-1 rounded-full border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-100">Kembali ke Beranda</button>
                 </div>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12 px-4">
      <div className="container mx-auto max-w-6xl grid md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden min-h-[90vh] bg-white">
        
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

        <div className="bg-white p-8 md:p-10 lg:p-12 overflow-y-auto">
          {isSubmitting && (
             <div className="absolute inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-semibold text-gray-700">Memproses donasi Anda...</p>
             </div>
          )}

          {donationStep === 'initialForm' && (
            <form onSubmit={handleInitialSubmit} className="w-full">
              <h1 className="mb-6 text-3xl font-bold text-gray-900">Formulir Donasi</h1>
              
              <div className="mb-6 border-b pb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Donasi sebagai:</p>
                <p className="rounded-md border border-gray-200 bg-gray-50 p-3 mb-2"><strong>{user?.nama}</strong></p>
                <div className="flex items-center">
                  <input type="checkbox" id="samarkan" checked={samarkanNama} onChange={(e) => setSamarkanNama(e.target.checked)} className="h-4 w-4 text-blue-600" />
                  <label htmlFor="samarkan" className="ml-2 text-sm text-gray-600">Samarkan nama saya (Anonymous)</label>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold">Jenis Donasi</h2>
                <div className="flex space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="donationType" value="uang" checked={donationType === 'uang'} onChange={() => setDonationType('uang')} className="peer sr-only" />
                    <div className={`rounded-lg border-2 p-4 text-center transition ${donationType === 'uang' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-300 text-gray-600'}`}>Uang</div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="donationType" value="barang" checked={donationType === 'barang'} onChange={() => setDonationType('barang')} className="peer sr-only" />
                    <div className={`rounded-lg border-2 p-4 text-center transition ${donationType === 'barang' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-300 text-gray-600'}`}>Barang</div>
                  </label>
                </div>
              </div>

              {donationType === 'uang' && (
                <div>
                  <label className="mb-2 block text-lg font-medium text-gray-700">Jumlah Nominal (Rp)</label>
                  <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} className="w-full rounded-md border p-3 text-lg focus:ring-blue-500" placeholder="Contoh: 50000" required />
                </div>
              )}
              {donationType === 'barang' && (
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-700">Detail Barang</h3>
                  {goods.map((good, index) => (
                    <div key={good.id} className="mb-4 flex items-center gap-2">
                      <input type="text" placeholder={`Jenis Barang ${index + 1}`} value={good.jenis} onChange={(e) => handleGoodChange(good.id, 'jenis', e.target.value)} className="flex-grow rounded-md border p-2" required />
                      <input type="text" placeholder="Jumlah" value={good.jumlah} onChange={(e) => handleGoodChange(good.id, 'jumlah', e.target.value)} className="w-1/3 rounded-md border p-2" required />
                      {goods.length > 1 && <button type="button" onClick={() => handleRemoveGood(good.id)} className="text-red-500 p-1"><Trash2 size={20} /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={handleAddGood} className="text-sm font-medium text-blue-600 hover:underline">+ Tambah Barang</button>
                </div>
              )}
              
              <button type="submit" disabled={!donationType} className={`mt-8 w-full rounded-full py-3 text-lg font-bold text-white transition ${!donationType ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}>Lanjut ke Konfirmasi</button>
            </form>
          )}

          {donationStep === 'donationConfirmation' && (
              <div className="w-full">
                  <h2 className="mb-6 text-2xl font-bold text-gray-900 text-center">Konfirmasi Donasi</h2>
                  <div className="mb-6 space-y-3 rounded-md border p-4 bg-gray-50">
                      <p><strong>Nama:</strong> {samarkanNama ? 'Anonymous' : user?.nama}</p>
                      <p><strong>Jenis:</strong> {donationType === 'uang' ? 'Uang' : 'Barang'}</p>
                      {donationType === 'uang' && <p><strong>Nominal:</strong> Rp {parseInt(nominal).toLocaleString('id-ID')}</p>}
                      {donationType === 'barang' && (
                        <ul className="list-disc list-inside ml-4">
                            {goods.map(g => <li key={g.id}>{g.jenis} ({g.jumlah})</li>)}
                        </ul>
                      )}
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => setDonationStep('initialForm')} className="flex-1 rounded-full border border-gray-300 py-3">Kembali</button>
                      <button onClick={handleConfirmationSubmit} className="flex-1 rounded-full bg-blue-600 py-3 font-bold text-white">Lanjut</button>
                  </div>
              </div>
          )}

          {donationStep === 'deliveryOptions' && (
              <form onSubmit={handleDeliverySubmit} className="w-full">
                 <h2 className="mb-6 text-2xl font-bold text-gray-900">Metode Pengiriman</h2>
                 <div className="space-y-4 mb-6">
                     <label className={`flex items-center cursor-pointer rounded-lg border-2 p-4 ${deliveryMethod === 'self' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                         <input type="radio" name="deliveryMethod" value="self" checked={deliveryMethod === 'self'} onChange={() => setDeliveryMethod('self')} className="h-5 w-5 text-blue-600"/>
                          <span className="ml-3 text-lg font-medium">Antar Sendiri (Self Delivery)</span>
                     </label>
                     <label className={`flex items-center cursor-pointer rounded-lg border-2 p-4 ${deliveryMethod === 'pickup' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                         <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="h-5 w-5 text-blue-600"/>
                          <span className="ml-3 text-lg font-medium">Minta Dijemput (Pick-Up)</span>
                     </label>
                 </div>
                 <button type="submit" className="w-full rounded-full bg-blue-600 py-3 font-bold text-white">Selanjutnya</button>
                 <button type="button" onClick={() => setDonationStep('donationConfirmation')} className="mt-4 w-full text-center text-sm text-gray-600 hover:underline">Kembali</button>
              </form>
          )}

          {/* --- STEP 4: DETAIL PENJEMPUTAN (TELAH DIPERBAIKI) --- */}
          {donationStep === 'pickupDetails' && (
              <form onSubmit={handlePickupSubmit} className="w-full">
                 <h2 className="mb-6 text-2xl font-bold text-gray-900">Detail Penjemputan</h2>
                 <div className="space-y-4 mb-6">
                     <div>
                         <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                          <textarea rows={3} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="w-full rounded-md border p-2 focus:border-blue-600" placeholder="Jl. Contoh No. 123..." required />
                     </div>
                      
                      {/* --- PERUBAHAN UTAMA: DROPDOWN TANGGAL --- */}
                      <div>
                         <label className="mb-1 block text-sm font-medium text-gray-700">Pilih Tanggal Penjemputan</label>
                         <select 
                            value={pickupDate} 
                            onChange={(e) => setPickupDate(e.target.value)} 
                            className="w-full rounded-md border p-2 bg-white focus:border-blue-600" 
                            required
                         >
                            <option value="" disabled>-- Pilih Tanggal (Senin/Rabu/Jumat) --</option>
                            {availableDates.map((date) => (
                              <option key={formatDateValue(date)} value={formatDateValue(date)}>
                                {formatDateDisplay(date)}
                              </option>
                            ))}
                         </select>
                         <p className="text-xs text-gray-500 mt-1">Penjemputan hanya tersedia hari Senin, Rabu, dan Jumat.</p>
                      </div>

                      <div>
                         <label className="mb-1 block text-sm font-medium text-gray-700">Pilih Waktu</label>
                          <select value={pickupTimeSlot} onChange={(e) => setPickupTimeSlot(e.target.value)} className="w-full rounded-md border p-2 bg-white focus:border-blue-600" required>
                             <option value="" disabled>-- Pilih Waktu --</option>
                              {PICKUP_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                          </select>
                      </div>
                 </div>
                 <button type="submit" className="w-full rounded-full bg-blue-600 py-3 font-bold text-white">Konfirmasi Penjemputan</button>
                 <button type="button" onClick={() => setDonationStep('deliveryOptions')} className="mt-4 w-full text-center text-sm text-gray-600 hover:underline">Kembali</button>
              </form>
          )}

          {donationStep === 'paymentOptions' && (
              <form onSubmit={handlePaymentSubmit} className="w-full">
                 <h2 className="mb-6 text-2xl font-bold text-gray-900">Pilih Metode Pembayaran</h2>
                 <div className="space-y-3 mb-6">
                     {(['ewallet', 'va', 'qris'] as PaymentMethod[]).map((method) => (
                         <label key={method} className={`flex items-center cursor-pointer rounded-lg border-2 p-4 ${paymentMethod === method ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                              <input type="radio" name="paymentMethod" value={method!} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="h-5 w-5 text-blue-600" />
                              <span className="ml-3 text-lg font-medium capitalize">{method === 'ewallet' ? 'E-Wallet' : method === 'va' ? 'Virtual Account' : 'QRIS'}</span>
                         </label>
                     ))}
                 </div>
                 <button type="submit" className="w-full rounded-full bg-blue-600 py-3 font-bold text-white">Lanjut ke Pembayaran</button>
                 <button type="button" onClick={() => setDonationStep('donationConfirmation')} className="mt-4 w-full text-center text-sm text-gray-600 hover:underline">Kembali</button>
              </form>
          )}

          {donationStep === 'finalSummary' && (
              <div className="w-full text-center">
                 <h2 className="mb-4 text-3xl font-bold text-green-600">Terima Kasih! 🙏</h2>
                 <p className="text-xl text-gray-700 font-medium mb-6">Donasi Anda telah berhasil dicatat.</p>
                 
                 <div className="bg-green-50 p-6 rounded-xl border border-green-100 mb-8 text-left">
                    <h3 className="font-bold text-lg text-green-800 mb-2">Ringkasan:</h3>
                    {donationType === 'uang' && <p>Transfer: <strong>Rp {parseInt(nominal).toLocaleString('id-ID')}</strong> via {paymentMethod?.toUpperCase()}</p>}
                    {donationType === 'barang' && deliveryMethod === 'self' && <p>Silakan antar ke alamat yayasan kami.</p>}
                    {donationType === 'barang' && deliveryMethod === 'pickup' && (
                           <div className="text-gray-700">
                               <p>Penjemputan dijadwalkan pada:</p>
                               <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                                   <p><strong>Tanggal:</strong> {pickupDate ? formatDateDisplay(new Date(pickupDate)) : '-'}</p>
                                   <p><strong>Jam:</strong> {pickupTimeSlot}</p>
                                   <p><strong>Alamat:</strong> {pickupAddress}</p>
                               </div>
                           </div>
                    )}
                 </div>
                 
                 <div className="space-y-3">
                    <Link href="/history" className="block w-full rounded-full bg-blue-600 py-3 font-bold text-white text-center hover:bg-blue-700">Lihat Riwayat Donasi Saya</Link>
                    <button onClick={() => router.push('/')} className="block w-full rounded-full border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-100">Kembali ke Beranda</button>
                 </div>
              </div>
          )}
        </div>
        
      </div>
    </div>
  )
}