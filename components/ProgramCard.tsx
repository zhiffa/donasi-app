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
  
  let percentage = 0;
  if (target > 0) {
    percentage = Math.round((collected / target) * 100);
  }
  if (percentage > 100) {
    percentage = 100;
  }

  return (
    // --- PERUBAHAN 1: rounded-3xl (lebih bulat) & h-full ---
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg transition-transform hover:scale-[1.02] flex flex-col h-full border border-gray-100">
      
      <Image
        src={imageUrl} 
        alt={title} 
        width={400} 
        height={400} 
        // Pastikan aspect-square agar tetap kotak rapi
        className="w-full aspect-square object-cover" 
      />

      {/* --- PERUBAHAN 2: Padding diperkecil (p-5) agar card terlihat lebih compact --- */}
      <div className="p-5 flex flex-col justify-between flex-grow"> 
        <div> 
          {/* Judul diperkecil sedikit (text-lg) */}
          <h3 className="mb-2 text-lg font-bold text-gray-900 truncate" title={title}>{title}</h3>
          {/* Margin bawah dikurangi (mb-3) */}
          <p className="mb-3 text-sm text-gray-600 line-clamp-2 leading-relaxed" title={description}>{description}</p>
          
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-gray-700">Terkumpul: <strong>Rp {collected.toLocaleString('id-ID')}</strong></span>
              <span className="text-pastel-pink-dark">{percentage}%</span>
            </div>
            {/* Progress bar sedikit lebih tipis (h-2) */}
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div 
                className="h-2 rounded-full bg-pastel-pink-dark" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-gray-400 mt-1">
              Target: Rp {target.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <Link 
          href={`/program/${id}`} 
          className="block w-full rounded-full bg-pastel-pink-dark py-2 px-4 text-center text-sm font-bold text-gray-900 transition hover:bg-pastel-pink-light mt-2"
        >
          Donate Now
        </Link>
      </div>
    </div>
  )
}