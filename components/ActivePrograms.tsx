import ProgramSlider from '@/components/ProgramSlider'; 
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 

export default async function ActivePrograms() {
  
  // 1. Ambil data dari tabel 'kegiatan' join 'donasi'
  const { data: programs, error } = await supabase
    .from('kegiatan')
    .select(`
      id_kegiatan,
      nama_program,
      deskripsi,
      url_poster,
      target_dana,
      donasi (
        nominal,
        status
      )
    `)
    .eq('status', 'Aktif')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FETCH_ERROR]', error);
    return (
      <div className="bg-white py-20 text-center text-red-600">
        <AlertCircle className="mx-auto h-12 w-12" />
        <h2 className="mt-4 text-2xl font-bold">Gagal memuat data</h2>
      </div>
    );
  }

  // 2. Kalkulasi nominal donasi
  const mappedPrograms = programs?.map((p: any) => {
    // Filter status 'Diterima' dan jumlahkan nominal
    const totalTerkumpul = p.donasi
      ? p.donasi
          .filter((d: any) => String(d.status).trim() === 'Diterima') 
          .reduce((sum: number, d: any) => sum + (parseFloat(d.nominal) || 0), 0)
      : 0;

    return {
      id: p.id_kegiatan,             // Database id_kegiatan -> Props id
      title: p.nama_program,         // Database nama_program -> Props title
      description: p.deskripsi,
      imageUrl: p.url_poster,
      target: parseFloat(p.target_dana) || 0, 
      collected: totalTerkumpul 
    };
  }) || [];

  if (mappedPrograms.length === 0) return null;

  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">Program Donasi Aktif</h2>
        <ProgramSlider programs={mappedPrograms as any} />
      </div>
    </div>
  );
}

export function ActiveProgramsSkeleton() {
  return <div className="py-20 text-center animate-pulse text-gray-400 font-bold">Memuat Program...</div>;
}