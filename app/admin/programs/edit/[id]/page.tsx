'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ArrowLeft, UploadCloud, Save } from 'lucide-react'

export default function EditProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    targetDana: '',
    status: 'Aktif', // Tambahkan status agar bisa diedit juga jika perlu
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentPoster, setCurrentPoster] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        // Gunakan endpoint GET tunggal (pastikan API ini tersedia)
        const res = await fetch(`/api/kegiatan/${params.id}`);
        if (!res.ok) throw new Error('Gagal mengambil data program');
        
        const data = await res.json();
        
        const formattedDate = data.tanggal_mulai ? new Date(data.tanggal_mulai).toISOString().split('T')[0] : '';

        setFormData({
          name: data.nama_program,
          description: data.deskripsi || '',
          startDate: formattedDate,
          targetDana: data.target_dana || '',
          status: data.status || 'Aktif',
        });
        setCurrentPoster(data.url_poster);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchProgram();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      // PENTING: Backend PATCH kita butuh ID di dalam FormData
      data.append('id', params.id); 
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('startDate', formData.startDate);
      data.append('targetDana', formData.targetDana);
      data.append('status', formData.status);
      
      if (file) {
        data.append('poster', file); 
      }
      
      // Arahkan ke endpoint /api/admin/programs (bukan /api/admin/programs/[id])
      // Karena route.ts kita berada di /api/admin/programs/route.ts
      const res = await fetch('/api/admin/programs', {
        method: 'PATCH',
        body: data, // Browser otomatis set boundary multipart/form-data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal memperbarui program');

      alert('Program berhasil diperbarui!');
      router.push('/admin/programs');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto my-10 border border-gray-100">
      <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/programs" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Edit Detail Program</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Program</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border border-gray-200 py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" required />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Dana (Rp)</label>
                <input type="number" name="targetDana" value={formData.targetDana} onChange={handleChange} className="w-full rounded-lg border border-gray-200 py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status Program</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-gray-200 py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Nonaktif">Nonaktif</option>
                </select>
            </div>
            
            <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Mulai</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full rounded-lg border border-gray-200 py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Poster Program</label>
          
          <div className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors group">
            {preview || currentPoster ? (
              <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden shadow-inner">
                <Image 
                  src={preview || currentPoster || ''} 
                  alt="Poster" 
                  fill 
                  className="object-cover"
                />
              </div>
            ) : (
              <UploadCloud className="h-12 w-12 text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
            )}
            
            <div className="text-center">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                  <UploadCloud size={16} />
                  <span>{currentPoster ? 'Ganti Poster' : 'Unggah Poster'}</span>
                  <input type="file" name="poster" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="mt-2 text-xs text-gray-400">Rasio 16:9 disarankan (JPG, PNG, max 2MB)</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Lengkap</label>
          <textarea name="description" rows={6} value={formData.description} onChange={handleChange} className="w-full rounded-lg border border-gray-200 py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Jelaskan detail program di sini..." />
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
          <Link href="/admin/programs" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Batal
          </Link>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300 shadow-md shadow-blue-200 transition-all active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5"/> : <Save size={18}/>}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}