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
    // --- PERUBAHAN DI SINI: tambahkan h-full untuk mengisi tinggi slide ---
    <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-transform hover:scale-[1.03] flex flex-col h-full">
      
      <Image
        src={imageUrl} 
        alt={title} 
        width={400} 
        height={500} 
        className="w-full aspect-[4/5] object-cover" 
      />

      {/* Konten card fleksibel, agar tombol selalu di bawah */}
      <div className="p-6 flex flex-col justify-between flex-grow"> {/* flex-grow agar mengisi sisa ruang */}
        <div> 
          <h3 className="mb-2 text-xl font-bold text-gray-900 truncate" title={title}>{title}</h3>
          <p className="mb-4 text-gray-700 line-clamp-2" title={description}>{description}</p>
          
          <div className="mb-4">
            <div className="mb-1 flex justify-between">
              <span className="text-sm font-medium text-gray-700">Terkumpul: <strong>Rp {collected.toLocaleString('id-ID')}</strong></span>
              <span className="text-sm font-medium text-pastel-pink-dark">{percentage}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200">
              <div 
                className="h-2.5 rounded-full bg-pastel-pink-dark" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-gray-500 mt-1">
              Target: Rp {target.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <Link 
          href={`/program/${id}`} 
          className="block w-full rounded-full bg-pastel-pink-dark py-2 px-4 text-center font-bold text-gray-900 transition hover:bg-pastel-pink-light mt-4"
        >
          Donate Now
        </Link>
      </div>
    </div>
  )
}