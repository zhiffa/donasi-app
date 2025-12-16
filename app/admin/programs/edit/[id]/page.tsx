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
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentPoster, setCurrentPoster] = useState<string | null>(null);

  // 1. Fetch Data Lama saat halaman dibuka
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await fetch(`/api/admin/programs/${params.id}`);
        if (!res.ok) throw new Error('Gagal mengambil data program');
        
        const data = await res.json();
        
        // Format tanggal YYYY-MM-DD untuk input type="date"
        const formattedDate = data.tanggal_mulai ? new Date(data.tanggal_mulai).toISOString().split('T')[0] : '';

        setFormData({
          name: data.nama_program,
          description: data.deskripsi || '',
          startDate: formattedDate,
          targetDana: data.target_dana || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('startDate', formData.startDate);
      data.append('targetDana', formData.targetDana);
      
      // Hanya kirim file jika user mengganti poster
      if (file) {
        data.append('poster', file); 
      }
      
      const res = await fetch(`/api/admin/programs/${params.id}`, {
        method: 'PATCH',
        body: data, 
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      alert('Program berhasil diperbarui!');
      router.push('/admin/programs');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/programs" className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit Program</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Program</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-md border border-gray-300 py-2 px-3 sm:text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Dana (Rp)</label>
          <input type="number" name="targetDana" value={formData.targetDana} onChange={handleChange} className="w-full rounded-md border border-gray-300 py-2 px-3 sm:text-sm" min="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full rounded-md border border-gray-300 py-2 px-3 sm:text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Poster Program</label>
          
          {/* Tampilkan Poster Lama jika belum ada preview baru */}
          {!preview && currentPoster && (
             <div className="mb-2 p-2 border rounded bg-gray-50 flex items-center gap-4">
                 <Image src={currentPoster} alt="Current" width={60} height={40} className="object-cover rounded h-10 w-auto"/>
                 <span className="text-xs text-gray-500">Poster saat ini</span>
             </div>
          )}

          <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
            <div className="space-y-1 text-center">
              {preview ? (
                <Image src={preview} alt="Preview" width={200} height={100} className="mx-auto h-24 w-auto object-contain rounded" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                  <span>Ganti Poster</span>
                  <input type="file" name="poster" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500">Biarkan kosong jika tidak ingin mengubah</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full rounded-md border border-gray-300 py-2 px-3 sm:text-sm" />
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5"/> : <Save size={18}/>}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}