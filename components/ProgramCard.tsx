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
  
  // Gunakan fallback 0 jika data undefined/null agar tidak crash
  const safeCollected = collected || 0;
  const safeTarget = target || 0;

  let percentage = 0;
  if (safeTarget > 0) {
    percentage = Math.round((safeCollected / safeTarget) * 100);
  }
  if (percentage > 100) {
    percentage = 100;
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg transition-transform hover:scale-[1.02] flex flex-col h-full border border-gray-100">
      
      <Image
        src={imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
        alt={title || 'Program'} 
        width={400} 
        height={400} 
        className="w-full aspect-square object-cover" 
      />

      <div className="p-5 flex flex-col justify-between flex-grow"> 
        <div> 
          <h3 className="mb-2 text-lg font-bold text-gray-900 truncate" title={title || ''}>
            {title || 'Tanpa Judul'}
          </h3>
          <p className="mb-3 text-sm text-gray-600 line-clamp-2 leading-relaxed" title={description || ''}>
            {description || 'Tidak ada deskripsi tersedia.'}
          </p>
          
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-gray-700">
                Terkumpul: <strong>Rp {safeCollected.toLocaleString('id-ID')}</strong>
              </span>
              <span className="text-pastel-pink-dark">{percentage}%</span>
            </div>
            
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div 
                className="h-2 rounded-full bg-pastel-pink-dark" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-gray-400 mt-1">
              Target: Rp {safeTarget.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <Link 
          href={`/programs/${id}`} 
          className="block w-full rounded-full bg-pastel-pink-dark py-2 px-4 text-center text-sm font-bold text-gray-900 transition hover:bg-pastel-pink-light mt-2"
        >
          Donate Now
        </Link>
      </div>
    </div>
  )
}