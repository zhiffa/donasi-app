// File: components/ProgramSlider.tsx
'use client'

import ProgramCard from '@/components/ProgramCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';

// CSS Swiper (tetap di-import dari globals.css, JANGAN di-import di sini)

interface PublicProgram {
  id_kegiatan: number;
  nama_program: string;
  deskripsi: string | null;
  url_poster: string | null;
  target_dana: number;
  terkumpul: number;
}

export default function ProgramSlider({ programs }: { programs: PublicProgram[] }) {
  
  return (
    <div className="relative"> 
      <Swiper
        modules={[Pagination, Navigation]}
        loop={programs.length > 3} // Loop hanya jika item lebih banyak dari view agar stabil
        pagination={{
          clickable: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        
        slidesPerView={1.2}
        spaceBetween={15}
        centeredSlides={true}

        breakpoints={{
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
            centeredSlides: false,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
            centeredSlides: false,
          },
        }}
        className="program-slider pb-12"
      >
        {programs.map((program) => (
          <SwiperSlide key={program.id_kegiatan} className="flex h-auto">
            <ProgramCard
              id={program.id_kegiatan}
              title={program.nama_program || 'Tanpa Nama Program'}
              description={program.deskripsi || 'Tidak ada deskripsi tersedia.'}
              imageUrl={program.url_poster || 'https://via.placeholder.com/400x500?text=No+Image'}
              // TAMBAHKAN FALLBACK (|| 0) UNTUK MENGHINDARI ERROR toLocaleString
              target={program.target_dana || 0}
              collected={program.terkumpul || 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Panah Kiri */}
      <div className="swiper-button-prev-custom absolute top-1/2 z-10 -translate-y-1/2 
                    cursor-pointer rounded-full bg-white/70 p-1 shadow-md hover:bg-white 
                    transition-colors duration-200 
                    left-2 md:-left-4 md:p-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FFB6C1" 
             className="h-5 w-5 md:h-6 md:w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </div>

      {/* Panah Kanan */}
      <div className="swiper-button-next-custom absolute top-1/2 z-10 -translate-y-1/2 
                    cursor-pointer rounded-full bg-white/70 p-1 shadow-md hover:bg-white 
                    transition-colors duration-200 
                    right-2 md:-right-4 md:p-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FFB6C1" 
             className="h-5 w-5 md:h-6 md:w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      <style jsx global>{`
        .program-slider .swiper-pagination-bullet-active {
          background: #FFB6C1 !important;
        }
        .program-slider .swiper-button-next,
        .program-slider .swiper-button-prev {
          display: none !important;
        }
      `}</style>
    </div>
  );
}