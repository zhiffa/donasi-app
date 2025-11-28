'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script' // <-- PENTING: Untuk load script Midtrans

// Tipe data
type DonationType = 'uang' | 'barang' | null
type DonationStep = 'initialForm' | 'donationConfirmation' | 'deliveryOptions' | 'pickupDetails' | 'paymentOptions' | 'finalSummary'
type DeliveryMethod = 'self' | 'pickup' | null
// PaymentMethod tidak dipilih manual di awal, tapi via Snap nanti
type PaymentMethod = 'midtrans' | null 

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

// --- LOGIKA TANGGAL (Senin/Rabu/Jumat) ---
const getNextPickupDates = () => {
  const dates: Date[] = [];
  const date = new Date();
  date.setDate(date.getDate() + 1); // Mulai cek dari BESOK (H+1) agar admin punya waktu persiapan

  // Cari 6 opsi tanggal valid ke depan
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
  
  // State Opsi Tanggal
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

    // --- LOGIKA PERCABANGAN FLOW ---
    if (donationType === 'uang') {
        // Jika Uang, langsung submit untuk dapat token Midtrans
        submitDonation('uang');
    } else {
        // Jika Barang, lanjut ke konfirmasi
        setDonationStep('donationConfirmation');
    }
  };

  const handleConfirmationSubmit = () => {
      // Logic ini hanya untuk barang sekarang, karena uang langsung submit di step 1
      if (donationType === 'barang') {
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
          submitDonation('barang_self'); 
      }
  };

   const handlePickupSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!pickupAddress || !pickupDate || !pickupTimeSlot) {
          alert('Lengkapi detail penjemputan.');
          return;
      }
      submitDonation('barang_pickup');
   };

   // (Step PaymentMethod manual dihapus karena diganti Midtrans Snap)

  // --- FUNGSI SUBMIT UTAMA ---
  const submitDonation = async (flowType: string) => {
    setIsSubmitting(true);

    let apiDeliveryMethod = null;
    if (donationType === 'barang') {
      if (flowType === 'barang_self') apiDeliveryMethod = 'Self-Delivery';
      else if (flowType === 'barang_pickup') apiDeliveryMethod = 'Pick-up';
    }

    const payload = {
      programId: params.programId,
      samarkanNama: samarkanNama,
      donationType: donationType,
      nominal: donationType === 'uang' ? parseFloat(nominal) : undefined,
      // paymentMethod tidak perlu dikirim manual, backend handle default 'Midtrans'
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

      // --- INTEGRASI MIDTRANS SNAP ---
      if (donationType === 'uang' && data.snapToken) {
        // @ts-ignore - Snap diload dari script eksternal
        window.snap.pay(data.snapToken, {
          onSuccess: function(result: any) {
            // Pembayaran sukses
            setDonationStep('finalSummary');
            setIsSubmitting(false);
          },
          onPending: function(result: any) {
            // Menunggu pembayaran (misal VA, user tutup popup tapi belum bayar)
            setDonationStep('finalSummary');
            setIsSubmitting(false);
          },
          onError: function(result: any) {
            alert("Pembayaran gagal!");
            setIsSubmitting(false);
          },
          onClose: function() {
            alert('Anda menutup popup pembayaran sebelum menyelesaikan transaksi.');
            setIsSubmitting(false);
          }
        });
      } else {
        // Jika Barang -> Langsung sukses (tidak ada pembayaran)
        setDonationStep('finalSummary');
        setIsSubmitting(false);
      }

    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message}`);
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
    <>
      {/* --- LOAD SCRIPT MIDTRANS DI SINI --- */}
      <Script 
        src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL} 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} 
        strategy="lazyOnload"
      />

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

            <div className="bg-white p-8 md:p-10 lg:p-12 overflow-y-auto relative">
                {isSubmitting && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-lg font-semibold text-gray-700">
                            {donationType === 'uang' ? 'Menyiapkan pembayaran...' : 'Memproses donasi...'}
                        </p>
                    </div>
                )}

                {/* STEP 1 */}
                {donationStep === 'initialForm' && (
                    <form onSubmit={handleInitialSubmit} className="w-full">
                        <h1 className="mb-6 text-3xl font-bold text-gray-900">Formulir Donasi</h1>
                        <p className="mb-4 text-gray-600">Donatur: <strong>{user?.nama}</strong></p>
                        
                        {/* Jenis Donasi */}
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
                                <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="Contoh: 50000" required />
                            </div>
                        )}

                        {donationType === 'barang' && (
                            <div className="mb-6">
                                <label className="block mb-2 font-medium">Detail Barang</label>
                                {goods.map((g, i) => (
                                    <div key={g.id} className="flex gap-2 mb-2">
                                        <input placeholder="Jenis" value={g.jenis} onChange={(e) => handleGoodChange(g.id, 'jenis', e.target.value)} className="flex-1 border p-2 rounded" required/>
                                        <input placeholder="Jml" value={g.jumlah} onChange={(e) => handleGoodChange(g.id, 'jumlah', e.target.value)} className="w-1/3 border p-2 rounded" required/>
                                        {goods.length > 1 && <button type="button" onClick={() => handleRemoveGood(g.id)} className="text-red-500 p-1"><Trash2 size={20} /></button>}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddGood} className="text-blue-600 text-sm">+ Tambah</button>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition">
                            {/* Text tombol berubah sesuai jenis donasi */}
                            {donationType === 'uang' ? 'Bayar Sekarang' : 'Lanjut'}
                        </button>
                    </form>
                )}

                {/* STEP BARANG: KONFIRMASI */}
                {donationStep === 'donationConfirmation' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center">Konfirmasi Barang</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <ul className="list-disc ml-5">
                                {goods.map(g => <li key={g.id}>{g.jenis} ({g.jumlah})</li>)}
                            </ul>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setDonationStep('initialForm')} className="flex-1 border py-3 rounded-full">Kembali</button>
                            <button onClick={handleConfirmationSubmit} className="flex-1 bg-blue-600 text-white py-3 rounded-full">Lanjut</button>
                        </div>
                    </div>
                )}

                {/* STEP BARANG: METODE KIRIM */}
                {donationStep === 'deliveryOptions' && (
                    <form onSubmit={handleDeliverySubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold">Pengiriman</h2>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${deliveryMethod === 'self' ? 'border-blue-600 bg-blue-50' : ''}`}>
                                <input type="radio" name="del" value="self" checked={deliveryMethod === 'self'} onChange={() => setDeliveryMethod('self')} /> Antar Sendiri
                            </label>
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${deliveryMethod === 'pickup' ? 'border-blue-600 bg-blue-50' : ''}`}>
                                <input type="radio" name="del" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} /> Pick-up
                            </label>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full font-bold">Selanjutnya</button>
                        <button type="button" onClick={() => setDonationStep('donationConfirmation')} className="mt-4 w-full text-center text-sm text-gray-600 hover:underline">Kembali</button>
                    </form>
                )}

                {/* STEP BARANG: PICKUP DETAIL (DENGAN DROPDOWN TANGGAL) */}
                {donationStep === 'pickupDetails' && (
                    <form onSubmit={handlePickupSubmit} className="space-y-4">
                        <h2 className="text-2xl font-bold">Detail Penjemputan</h2>
                        <textarea placeholder="Alamat Lengkap" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="w-full border p-3 rounded-lg" required />
                        
                        <select value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full border p-3 rounded-lg bg-white" required>
                            <option value="" disabled>-- Pilih Tanggal (Senin/Rabu/Jumat) --</option>
                            {availableDates.map(date => (
                                <option key={formatDateValue(date)} value={formatDateValue(date)}>{formatDateDisplay(date)}</option>
                            ))}
                        </select>

                        <select value={pickupTimeSlot} onChange={(e) => setPickupTimeSlot(e.target.value)} className="w-full border p-3 rounded-lg bg-white" required>
                            <option value="" disabled>-- Pilih Jam --</option>
                            {PICKUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full font-bold">Konfirmasi Penjemputan</button>
                        <button type="button" onClick={() => setDonationStep('deliveryOptions')} className="mt-4 w-full text-center text-sm text-gray-600 hover:underline">Kembali</button>
                    </form>
                )}

                {/* STEP FINAL (Disesuaikan untuk Uang/Barang) */}
                {donationStep === 'finalSummary' && (
                    <div className="text-center space-y-6">
                        <h2 className="text-3xl font-bold text-green-600">Terima Kasih! 🙏</h2>
                        <p className="text-xl text-gray-700 font-medium mb-6">
                             {donationType === 'uang' 
                                ? 'Transaksi Anda sedang diproses.' 
                                : 'Donasi barang berhasil dicatat.'}
                        </p>
                        
                        {donationType === 'uang' && (
                            <p className="text-gray-600 mb-6">
                                Silakan selesaikan pembayaran di popup yang muncul. Status donasi akan otomatis berubah menjadi <strong>Diterima</strong> setelah pembayaran sukses.
                            </p>
                        )}

                        <div className="space-y-3">
                            <Link href="/history" className="block w-full rounded-full bg-blue-600 py-3 font-bold text-white hover:bg-blue-700">
                                Cek Status Donasi
                            </Link>
                            <button onClick={() => router.push('/')} className="block w-full rounded-full border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-100">
                                Kembali ke Beranda
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </>
  )
}