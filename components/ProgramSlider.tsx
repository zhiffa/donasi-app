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
    // Pastikan div ini memiliki 'relative'
    <div className="relative"> 
      <Swiper
        modules={[Pagination, Navigation]}
        loop={true}
        pagination={{
          clickable: true,
        }}
        navigation={{ // Tautkan ke elemen panah kustom kita
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        
        // --- PERUBAHAN UTAMA UNTUK MOBILE ---
        slidesPerView={1.2}   // Tampilkan 1 card utuh dan "intip" 20% card berikutnya
        spaceBetween={15}   // Jarak antar card
        centeredSlides={true} // Buat card yang aktif ada di tengah
        // ------------------------------------

        // Breakpoints ini akan menimpa pengaturan di atas saat layar lebih besar
        breakpoints={{
          // Tablet
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
            centeredSlides: false, // Matikan 'centered' di tablet
          },
          // Desktop
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
            centeredSlides: false, // Matikan 'centered' di desktop
          },
        }}
        className="program-slider pb-12" // Padding bawah untuk pagination dots
      >
        {programs.map((program) => (
          // 'h-auto' penting agar Swiper bisa mengatur tinggi slide dengan benar
          <SwiperSlide key={program.id_kegiatan} className="flex h-auto">
            <ProgramCard
              id={program.id_kegiatan}
              title={program.nama_program}
              description={program.deskripsi || ''}
              imageUrl={program.url_poster || 'https://via.placeholder.com/400x500?text=No+Image'}
              target={program.target_dana}
              collected={program.terkumpul}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* --- PANAH NAVIGASI (RESPONSIF) --- */}
      {/* Kita buat panah ini responsif. Di mobile, ukurannya kecil dan menempel di tepi.
          Di desktop (md:), ukurannya lebih besar dan sedikit keluar. */}
      
      {/* Panah Kiri */}
      <div className="swiper-button-prev-custom absolute top-1/2 z-10 -translate-y-1/2 
                    cursor-pointer rounded-full bg-white/70 p-1 shadow-md hover:bg-white 
                    transition-colors duration-200 
                    left-2 md:-left-4 md:p-2"> {/* Posisi mobile (left-2) & desktop (md:-left-4) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FFB6C1" 
             className="h-5 w-5 md:h-6 md:w-6"> {/* Ukuran mobile (h-5) & desktop (md:h-6) */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </div>

      {/* Panah Kanan */}
      <div className="swiper-button-next-custom absolute top-1/2 z-10 -translate-y-1/2 
                    cursor-pointer rounded-full bg-white/70 p-1 shadow-md hover:bg-white 
                    transition-colors duration-200 
                    right-2 md:-right-4 md:p-2"> {/* Posisi mobile (right-2) & desktop (md:-right-4) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FFB6C1" 
             className="h-5 w-5 md:h-6 md:w-6"> {/* Ukuran mobile (h-5) & desktop (md:h-6) */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      {/* CSS Kustom (tidak berubah) */}
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