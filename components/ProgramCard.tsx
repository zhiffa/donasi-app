'use client'
import Link from 'next/link'
import Image from 'next/image'

interface ProgramCardProps {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  target: number;
  collected: number;
}

export default function ProgramCard({ 
  id, 
  title, 
  description, 
  imageUrl, 
  target, 
  collected 
}: ProgramCardProps) {
  
  // Memastikan input adalah angka untuk menghindari error .toLocaleString()
  const safeCollected = Number(collected) || 0;
  const safeTarget = Number(target) || 0;

  // Hitung persentase donasi
  let percentage = 0;
  if (safeTarget > 0) {
    percentage = Math.round((safeCollected / safeTarget) * 100);
  }

  // Batas maksimal lebar visual progress bar adalah 100%
  const displayPercentage = percentage > 100 ? 100 : percentage;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg transition-transform hover:scale-[1.01] flex flex-col h-full border border-gray-100">
      
      {/* Container Gambar dengan Aspect Ratio 1:1 */}
      <div className="relative aspect-square w-full">
        <Image
          src={imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
          alt={title || 'Program Image'} 
          fill
          className="object-cover" 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Konten Kartu */}
      <div className="p-5 flex flex-col justify-between flex-grow"> 
        <div> 
          <h3 className="mb-2 text-lg font-bold text-gray-900 truncate" title={title || ''}>
            {title || 'Tanpa Judul'}
          </h3>
          <p className="mb-4 text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description || 'Tidak ada deskripsi tersedia.'}
          </p>
          
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className="text-gray-700">
                Terkumpul: <strong>Rp {safeCollected.toLocaleString('id-ID')}</strong>
              </span>
              <span className="text-pink-600 font-bold">{percentage}%</span>
            </div>
            
            {/* Background Bar */}
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              {/* Progress Bar Active */}
              <div 
                className="h-2 rounded-full bg-pink-500 transition-all duration-1000 ease-out" 
                style={{ width: `${displayPercentage}%` }}
              ></div>
            </div>
            
            <p className="text-right text-[10px] text-gray-400 mt-1.5 uppercase tracking-wider font-medium">
              Target: Rp {safeTarget.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <Link 
          href={`/programs/${id}`} 
          className="block w-full rounded-full bg-pink-100 py-2.5 text-center text-sm font-bold text-pink-700 transition-colors hover:bg-pink-200"
        >
          Donate Now
        </Link>
      </div>
    </div>
  )
}