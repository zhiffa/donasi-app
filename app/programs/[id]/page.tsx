// File: app/programs/[id]/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  // 1. Ambil data kegiatan dan JOIN dengan tabel donasi
  const { data: program, error } = await supabase
    .from('kegiatan')
    .select(`
      *,
      donasi (
        nominal,
        status
      )
    `)
    .eq('id_kegiatan', params.id)
    .single();

  // 2. Jika error atau data tidak ada, tampilkan 404
  if (error || !program) {
    notFound();
  }

  // 3. Hitung total donasi yang statusnya 'Diterima'
  const totalTerkumpul = program.donasi
    ? program.donasi
        .filter((d: any) => d.status === 'Diterima') // SESUAI PERMINTAAN: Filter status 'Diterima'
        .reduce((sum: number, d: any) => sum + (Number(d.nominal) || 0), 0)
    : 0;

  const safeTarget = Number(program.target_dana) || 0;
  const safeCollected = totalTerkumpul;

  // 4. Kalkulasi Persentase
  let percentage = 0;
  if (safeTarget > 0) {
    percentage = Math.round((safeCollected / safeTarget) * 100);
  }
  const displayPercentage = percentage > 100 ? 100 : percentage;

  return (
    <div className="bg-gray-50 min-h-screen"> 
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-10">
                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                        
                        {/* === POSTER === */}
                        <div className="w-full lg:w-5/12 flex-shrink-0 lg:sticky lg:top-24">
                            <div className="relative aspect-[4/5] w-full bg-gray-100 rounded-xl overflow-hidden border shadow-sm">
                                {program.url_poster ? (
                                    <Image
                                      src={program.url_poster}
                                      alt={program.nama_program}
                                      fill
                                      className="object-cover"
                                      priority
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No Image Available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* === KONTEN === */}
                        <div className="w-full lg:w-7/12 flex flex-col">
                            <h1 className="mb-4 text-3xl font-bold text-gray-900 leading-tight">
                                {program.nama_program}
                            </h1>
                            
                            {/* Progress Section */}
                            <div className="mb-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <div className="flex justify-between text-sm font-semibold text-gray-500 mb-2">
                                    <span>Terkumpul</span>
                                    <span>Target Dana</span>
                                </div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-3xl font-extrabold text-blue-600">
                                      Rp {safeCollected.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-lg font-bold text-gray-600">
                                      Rp {safeTarget.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-in-out" 
                                      style={{ width: `${displayPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-3">
                                    <span className="text-sm font-bold text-blue-700">{percentage}% Tercapai</span>
                                    <span className="text-sm text-gray-500 font-medium">
                                        {program.donasi?.filter((d: any) => d.status === 'Diterima').length || 0} Donatur Berhasil
                                    </span>
                                </div>
                            </div>

                            <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">Deskripsi Program</h2>
                            <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap min-h-[300px]">
                                {program.deskripsi || 'Deskripsi belum tersedia.'}
                            </div>
                        </div>
                    </div> 

                    {/* --- TOMBOL AKSI --- */}
                    <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href={`/donate/${program.id_kegiatan}`}
                            className="w-full sm:w-64 rounded-full bg-blue-600 py-4 text-center text-lg font-bold text-white shadow-lg hover:bg-blue-700 transition-transform hover:-translate-y-1"
                        >
                            Donasi Sekarang
                        </Link>
                        <Link 
                            href={`/live-reports/${program.id_kegiatan}`}
                            className="w-full sm:w-64 rounded-full border-2 border-blue-600 py-4 text-center text-lg font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            Lihat Laporan
                        </Link>
                    </div>
                    <p className="text-center text-gray-400 text-xs mt-6">
                        Data diperbarui secara otomatis setelah verifikasi admin.
                    </p>
                </div>
            </div>
        </div>
    </div>
  )
}