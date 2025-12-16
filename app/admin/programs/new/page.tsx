'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ArrowLeft, UploadCloud } from 'lucide-react'

interface ProgramFormData {
  name: string;
  description: string;
  startDate: string;
  targetDana: string;
}

export default function NewProgramPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    description: '',
    startDate: '',
    targetDana: '',
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
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
      
      if (file) {
        data.append('poster', file); 
      }
      
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        body: data, 
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal membuat program');
      }

      alert('Program berhasil dibuat!');
      router.push('/admin/programs');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiahPreview = (val: string) => {
    if (!val) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/programs"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Tambah Program Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Program</label>
          <input
            type="text" id="name" name="name"
            value={formData.name} onChange={handleChange}
            className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
            placeholder="Contoh: Bantu Pendidikan Anak" required
          />
        </div>

        <div>
          <label htmlFor="targetDana" className="block text-sm font-medium text-gray-700 mb-1">Target Dana (Rp)</label>
          <input
            type="number" id="targetDana" name="targetDana"
            value={formData.targetDana} onChange={handleChange}
            className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
            placeholder="Masukkan nominal angka saja, cth: 10000000" 
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Preview: <span className="font-semibold text-green-600">{formatRupiahPreview(formData.targetDana)}</span>
          </p>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
          <input
            type="date" id="startDate" name="startDate"
            value={formData.startDate} onChange={handleChange}
            className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Poster Program (Opsional)</label>
          <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
            <div className="space-y-1 text-center">
              {preview ? (
                <Image src={preview} alt="Preview poster" width={200} height={100} className="mx-auto h-24 w-auto object-contain rounded" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600 justify-center">
                <label htmlFor="poster" className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none hover:text-blue-500">
                  <span>Upload a file</span>
                  <input id="poster" name="poster" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP (Maks 2MB)</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
          <textarea
            id="description" name="description" rows={4}
            value={formData.description} onChange={handleChange}
            className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
            placeholder="Jelaskan detail program di sini..."
          />
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}
        
        <div className="flex justify-end">
          <button type="submit" className="flex items-center justify-center gap-2 w-full md:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</> : 'Simpan Program'}
          </button>
        </div>

      </form>
    </div>
  )
}