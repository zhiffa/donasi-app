import Link from 'next/link'
import { FileText, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default async function FinishedPrograms() {
  // 1. Ambil data langsung di dalam komponen (Server Component)
  // Kita filter hanya status 'Selesai'
  const { data: programs, error } = await supabase
    .from('kegiatan')
    .select('*')
    .eq('status', 'Selesai')
    .order('tanggal_mulai', { ascending: false });

  if (error) {
    console.error('[FETCH_FINISHED_ERROR]', error);
    return null;
  }

  // Jika tidak ada program selesai, section ini tidak akan muncul (Clean UI)
  if (!programs || programs.length === 0) return null;

  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 uppercase tracking-tight">
            Laporan Program Selesai
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Wujud transparansi amanah donatur untuk program-program yang telah sukses terlaksana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program: any) => (
            <div 
              key={program.id_kegiatan} 
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-100 flex flex-col group"
            >
              {/* Bagian Konten */}
              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                   <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                      <CheckCircle size={14}/> Terlaksana
                   </span>
                   <span className="text-[11px] font-medium text-gray-400">
                      {program.tanggal_mulai 
                        ? new Date(program.tanggal_mulai).toLocaleDateString('id-ID', {year:'numeric', month:'long'})
                        : 'Tanggal tidak tersedia'}
                   </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {program.nama_program}
                </h3>
                
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                  {program.deskripsi || 'Detail laporan pelaksanaan program dapat dilihat melalui tombol di bawah ini.'}
                </p>
              </div>

              {/* Bagian Tombol */}
              <div className="p-8 pt-0 mt-auto">
                <Link 
                  href={`/programs/${program.id_kegiatan}/report`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 border border-blue-100 hover:border-blue-600"
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