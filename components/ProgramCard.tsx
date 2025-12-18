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

export default function ProgramCard({ id, title, description, imageUrl, target, collected }: ProgramCardProps) {
  // Pastikan tipe data adalah number
  const safeCollected = parseFloat(collected as any) || 0;
  const safeTarget = parseFloat(target as any) || 0;

  let percentage = 0;
  if (safeTarget > 0) {
    percentage = Math.round((safeCollected / safeTarget) * 100);
  }
  const displayPercentage = percentage > 100 ? 100 : percentage;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg flex flex-col h-full border border-gray-100 transition-all hover:shadow-xl">
      <div className="relative aspect-square w-full">
        <Image 
          src={imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
          alt={title || 'Program'} 
          fill 
          className="object-cover" 
        />
      </div>

      <div className="p-5 flex flex-col justify-between flex-grow"> 
        <div> 
          <h3 className="mb-2 text-lg font-bold text-gray-900 truncate">{title}</h3>
          <p className="mb-4 text-sm text-gray-600 line-clamp-2">{description}</p>
          
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className="text-gray-700 font-bold text-blue-600">
                Rp {safeCollected.toLocaleString('id-ID')}
              </span>
              <span className="text-pink-600">{percentage}%</span>
            </div>
            
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-pink-500 transition-all duration-1000" 
                style={{ width: `${displayPercentage}%` }}
              ></div>
            </div>
            
            <p className="text-right text-[10px] text-gray-400 mt-1 uppercase font-bold">
              Target: Rp {safeTarget.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <Link 
          href={`/programs/${id}`} 
          className="block w-full rounded-full bg-blue-50 py-2.5 text-center text-sm font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all"
        >
          Donasi Sekarang
        </Link>
      </div>
    </div>
  );
}