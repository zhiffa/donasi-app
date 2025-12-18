export const revalidate = 0;
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
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

  if (error || !program) {
    notFound();
  }

  const totalTerkumpul = program.donasi
    ? program.donasi
        .filter((d: any) => String(d.status).trim() === 'Diterima') 
        .reduce((sum: number, d: any) => sum + (parseFloat(d.nominal) || 0), 0)
    : 0;

  const safeTarget = parseFloat(program.target_dana) || 0;
  const safeCollected = totalTerkumpul;

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
                        
                        <div className="w-full lg:w-5/12 flex-shrink-0 lg:sticky lg:top-24">
                            <div className="relative aspect-[4/5] w-full bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                                {program.url_poster ? (
                                    <Image src={program.url_poster} alt={program.nama_program} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                )}
                            </div>
                        </div>

                        <div className="w-full lg:w-7/12 flex flex-col">
                            <h1 className="mb-4 text-3xl font-bold text-gray-900 leading-tight">
                                {program.nama_program}
                            </h1>
                            
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
                                      className="h-full rounded-full bg-blue-600 transition-all duration-700" 
                                      style={{ width: `${displayPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="mt-2 text-right text-xs font-bold text-blue-700">{percentage}% Tercapai</p>
                            </div>

                            <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">Deskripsi</h2>
                            <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                                {program.deskripsi}
                            </div>
                        </div>
                    </div> 

                    <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href={`/donate/${program.id_kegiatan}`} className="w-full sm:w-64 rounded-full bg-blue-600 py-4 text-center font-bold text-white shadow-lg hover:bg-blue-700 transition-transform hover:-translate-y-1">
                            Donasi Sekarang
                        </Link>
                        <Link href={`/live-reports/${program.id_kegiatan}`} className="w-full sm:w-64 rounded-full border-2 border-blue-600 py-4 text-center font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                            Lihat Laporan
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}