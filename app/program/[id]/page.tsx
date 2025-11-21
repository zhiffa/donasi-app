import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

// Interface sesuai dengan response RPC 'get_kegiatan_details'
interface ProgramDetail {
  id_kegiatan: number;
  nama_program: string;
  deskripsi: string | null;
  url_poster: string | null;
  target_dana: number;
  tanggal_mulai: string;
  status: 'Draft' | 'Aktif' | 'Selesai';
  terkumpul: number; // Hasil kalkulasi dari backend
}

// Fetch data langsung di server
async function getProgramDetail(id: string): Promise<ProgramDetail | null> {
  try {
    // Gunakan URL absolut jika di server (fallback ke localhost jika env belum ada)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/kegiatan/${id}`, {
       cache: 'no-store' // Selalu data terbaru
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error('[FETCH_PROGRAM_DETAIL_ERROR]', error);
    return null;
  }
}

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  // params.id adalah ID kegiatan dari URL
  const program = await getProgramDetail(params.id)

  if (!program) {
    notFound();
  }

  // Kalkulasi Persentase
  let percentage = 0;
  if (program.target_dana > 0) {
    percentage = Math.round((program.terkumpul / program.target_dana) * 100);
  }
  if (percentage > 100) percentage = 100;

  return (
    <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            
            {/* Poster Section */}
            <div className="relative h-64 md:h-96 w-full bg-gray-200">
                {program.url_poster ? (
                    <Image
                    src={program.url_poster}
                    alt={program.nama_program}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No Image Available
                    </div>
                )}
            </div>
            
            <div className="p-8">
                <h1 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900">{program.nama_program}</h1>
                
                {/* Progress Bar */}
                <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                        <span>Terkumpul</span>
                        <span>Target</span>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-2xl font-bold text-blue-600">Rp {program.terkumpul.toLocaleString('id-ID')}</span>
                        <span className="text-lg font-medium text-gray-500">Rp {program.target_dana.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div 
                        className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-right text-xs text-gray-500 mt-1">{percentage}% tercapai</p>
                </div>

                <h2 className="mb-4 text-2xl font-bold text-gray-800">Tentang Program</h2>
                <div className="mb-8 text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {program.deskripsi || 'Tidak ada deskripsi untuk program ini.'}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row pt-4 border-t">
                    <Link 
                        href={`/live-reports/${program.id_kegiatan}`}
                        className="flex-1 rounded-full border-2 border-blue-600 py-3 px-6 text-center font-bold text-blue-600 transition hover:bg-blue-50"
                    >
                        Lihat Laporan Donasi
                    </Link>
                    <Link 
                        href={`/donate/${program.id_kegiatan}`}
                        className="flex-1 rounded-full bg-blue-600 py-3 px-6 text-center font-bold text-white transition hover:bg-blue-700 hover:shadow-lg"
                    >
                        Donasi Sekarang
                    </Link>
                </div>
            </div>
        </div>
        </div>
    </div>
  )
}