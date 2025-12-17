import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// Interface tetap sama
interface ProgramDetail {
  id_kegiatan: number;
  nama_program: string;
  deskripsi: string | null;
  url_poster: string | null;
  target_dana: number;
  tanggal_mulai: string;
  status: 'Draft' | 'Aktif' | 'Selesai';
  terkumpul: number;
}

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  // 1. Ganti fetch dengan query Supabase langsung
  const { data: program, error } = await supabase
    .from('kegiatan')
    .select('*')
    .eq('id_kegiatan', params.id)
    .single();

  // 2. Jika error atau data tidak ada, tampilkan 404
  if (error || !program) {
    notFound();
  }

  // 3. Gunakan fallback 0 untuk angka agar tidak crash toLocaleString
  const safeTarget = program.target_dana || 0;
  const safeCollected = program.terkumpul || 0;

  // Kalkulasi Persentase
  let percentage = 0;
  if (safeTarget > 0) {
    percentage = Math.round((safeCollected / safeTarget) * 100);
  }
  if (percentage > 100) percentage = 100;

  return (
    <div className="bg-gray-50 min-h-screen"> 
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="p-6 md:p-10">
                    <div className="flex flex-col lg:flex-row gap-10 items-start relative">
                        
                        {/* === KOLOM KIRI: POSTER (STICKY) === */}
                        <div className="w-full lg:w-5/12 flex-shrink-0 lg:sticky lg:top-24 self-start">
                            <div className="relative aspect-[4/5] w-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                {program.url_poster ? (
                                    <Image
                                      src={program.url_poster}
                                      alt={program.nama_program}
                                      fill
                                      className="object-contain"
                                      priority
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 bg-gray-100">
                                        No Image Available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* === KOLOM KANAN: KONTEN === */}
                        <div className="w-full lg:w-7/12 flex flex-col">
                            <h1 className="mb-4 text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                                {program.nama_program}
                            </h1>
                            
                            {/* Progress Bar */}
                            <div className="mb-6 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                                    <span>Terkumpul</span>
                                    <span>Target</span>
                                </div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-2xl font-bold text-blue-600">
                                      Rp {safeCollected.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-lg font-medium text-gray-500">
                                      Rp {safeTarget.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-xs text-gray-500 mt-2 font-medium">{percentage}% dari target tercapai</p>
                            </div>

                            <h2 className="mb-3 text-xl font-bold text-gray-800 border-b pb-2">Tentang Program</h2>
                            
                            <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap min-h-[400px]">
                                {program.deskripsi || 'Tidak ada deskripsi untuk program ini.'}
                            </div>
                        </div>
                    </div> 

                    {/* --- BAGIAN BAWAH: BUTTONS --- */}
                    <div className="mt-12 pt-6 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            
                            <Link 
                                href={`/live-reports/${program.id_kegiatan}`}
                                className="w-full sm:w-auto sm:min-w-[240px] flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 py-4 px-6 text-center font-bold text-blue-600 transition-all hover:bg-blue-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                Lihat Laporan
                            </Link>

                            <Link 
                                href={`/donate/${program.id_kegiatan}`}
                                className="w-full sm:w-auto sm:min-w-[280px] rounded-full bg-blue-600 py-4 px-8 text-center text-xl font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1"
                            >
                                Donasi Sekarang
                            </Link>

                        </div>
                        <p className="text-center text-gray-400 text-sm mt-6">
                            Pembayaran aman & verifikasi otomatis
                        </p>
                    </div>

                </div>
            </div>
        </div>
    </div>
  )
}