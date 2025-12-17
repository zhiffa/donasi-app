// components/FinishedPrograms.tsx
import Link from 'next/link'
import { FileText, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// Fungsi untuk mengambil data langsung dari DB (Server-side)
async function getFinishedPrograms() {
  const { data, error } = await supabase
    .from('kegiatan')
    .select('*')
    .eq('status', 'Selesai')
    .order('tanggal_mulai', { ascending: false });

  if (error) {
    console.error('Error fetching finished programs:', error);
    return [];
  }
  return data || [];
}

export default async function FinishedPrograms() {
  const programs = await getFinishedPrograms();

  // Jika tidak ada program selesai, jangan tampilkan section ini
  if (programs.length === 0) return null;

  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Laporan Program Selesai</h2>
          <p className="text-gray-600">Transparansi dana untuk program-program yang telah terlaksana.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program: any) => (
            <div key={program.id_kegiatan} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-blue-100 flex flex-col">
              {/* Header Card */}
              <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                   <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <CheckCircle size={12}/> Terlaksana
                   </span>
                   <span className="text-xs text-gray-400">
                      {new Date(program.tanggal_mulai).toLocaleDateString('id-ID', {year:'numeric', month:'long'})}
                   </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{program.nama_program}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                  {program.deskripsi || 'Program telah selesai dilaksanakan. Klik tombol di bawah untuk melihat laporan penggunaan dana secara rinci.'}
                </p>
              </div>

              {/* Footer Card / Button */}
              <div className="p-6 pt-0 mt-auto">
                <Link 
                  href={`/programs/${program.id_kegiatan}/report`}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <FileText size={18} />
                  Lihat Laporan Dana
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}