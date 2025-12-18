import ProgramSlider from '@/components/ProgramSlider'; 
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ActivePrograms() {
  const { data: programs, error } = await supabase
    .from('kegiatan')
    .select(`
      id_kegiatan,
      nama_program,
      deskripsi,
      url_poster,
      target_dana,
      status,
      donasi (
        nominal,
        status
      )
    `)
    .eq('status', 'Aktif')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="bg-white py-20 text-center text-red-600">
        <AlertCircle className="mx-auto h-12 w-12" />
        <h2 className="mt-4 text-2xl font-bold">Gagal memuat data</h2>
      </div>
    );
  }

  const mappedPrograms = programs?.map((p: any) => {
    const totalTerkumpul = p.donasi
      ? p.donasi
          .filter((d: any) => String(d.status).trim() === 'Diterima') 
          .reduce((sum: number, d: any) => sum + (parseFloat(d.nominal) || 0), 0)
      : 0;

    // KUNCI PERBAIKAN: Gunakan nama properti yang sesuai dengan PublicProgram
    return {
      id_kegiatan: p.id_kegiatan,
      nama_program: p.nama_program,
      deskripsi: p.deskripsi,
      url_poster: p.url_poster,
      target_dana: parseFloat(p.target_dana) || 0,
      terkumpul: totalTerkumpul,
      // Jika ProgramSlider butuh id/title (alias), tetap sertakan agar aman
      id: p.id_kegiatan,
      title: p.nama_program,
      imageUrl: p.url_poster,
      collected: totalTerkumpul,
      target: parseFloat(p.target_dana) || 0,
    };
  }) || [];

  if (mappedPrograms.length === 0) return null;

  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">Program Donasi Aktif</h2>
        <ProgramSlider programs={mappedPrograms} />
      </div>
    </div>
  );
}

export function ActiveProgramsSkeleton() {
  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-10 w-64 bg-gray-200 animate-pulse mx-auto mb-12 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[450px] bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}