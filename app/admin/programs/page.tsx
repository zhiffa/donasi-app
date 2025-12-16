'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// Import ikon Edit, PlusCircle, XCircle, Loader2
import { PlusCircle, XCircle, Loader2, Edit } from 'lucide-react' 
import { useRouter } from 'next/navigation'

// Interface Data Program
interface DonationProgram {
  id_kegiatan: number; 
  url_poster: string | null;
  nama_program: string;
  tanggal_mulai: string;
  deskripsi: string | null;
  target_dana: number;
  // Kita tambahkan 'Berjalan' di sini supaya TypeScript tidak error saat pengecekan
  status: 'Draft' | 'Aktif' | 'Berjalan' | 'Selesai'; 
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<DonationProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- FETCH DATA ---
  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/programs');
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal mengambil data program');
      }
      
      const data: DonationProgram[] = await res.json();
      setPrograms(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // --- HANDLER STOP PROGRAM ---
  const handleStopProgram = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghentikan program "${name}"? Status akan berubah menjadi 'Selesai'.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/programs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: 'Selesai' 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghentikan program');
      }

      alert('Program berhasil dihentikan.');
      fetchPrograms(); // Refresh data

    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };
  
  // --- HELPER FORMAT TANGGAL ---
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Error: {error}</p>
        <button onClick={fetchPrograms} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Program Donasi</h1>
        <Link
          href="/admin/programs/new"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          <PlusCircle size={20} />
          Tambah Program
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poster</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Dana</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programs.length > 0 ? (
              programs.map((program) => (
                <tr key={program.id_kegiatan}>
                  {/* Kolom Poster */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {program.url_poster ? (
                        <Image
                          src={program.url_poster}
                          alt={`Poster ${program.nama_program}`}
                          width={100}
                          height={50}
                          className="object-cover rounded h-12 w-auto"
                        />
                    ) : (
                        <div className="h-12 w-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                    )}
                  </td>

                  {/* Kolom Nama */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{program.nama_program}</div>
                  </td>

                  {/* Kolom Target Dana */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-700">
                        {program.target_dana > 0 
                            ? `Rp ${Number(program.target_dana).toLocaleString('id-ID')}` 
                            : 'Tidak ditentukan'}
                    </div>
                  </td>

                  {/* Kolom Tanggal */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{formatDate(program.tanggal_mulai)}</div>
                  </td>

                  {/* Kolom Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        program.status === 'Aktif' || program.status === 'Berjalan' ? 'bg-green-100 text-green-800' : 
                        program.status === 'Selesai' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {program.status}
                    </span>
                  </td>

                  {/* Kolom Aksi (EDIT & STOP) */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center">
                        
                        {/* TOMBOL EDIT: Selalu muncul agar bisa edit typo dsb */}
                        <Link 
                            href={`/admin/programs/edit/${program.id_kegiatan}`}
                            className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded-md transition-colors border border-yellow-200"
                            title="Edit Program"
                        >
                            <Edit size={16} /> Edit
                        </Link>

                        {/* TOMBOL STOP: Hanya muncul jika status Aktif/Berjalan */}
                        {(program.status === 'Aktif' || program.status === 'Berjalan') && (
                            <button
                              onClick={() => handleStopProgram(program.id_kegiatan, program.nama_program)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors border border-red-200"
                              title="Hentikan Program"
                            >
                              <XCircle size={16} /> Stop
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Belum ada data program.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}