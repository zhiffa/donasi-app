import { Suspense } from 'react'
import Hero from '@/components/Hero'
import AboutUs from '@/components/AboutUs'
import Achievements from '@/components/Achievements'
import ActivePrograms, { ActiveProgramsSkeleton } from '@/components/ActivePrograms'
import FinishedPrograms from '@/components/FinishedPrograms' // <-- 1. Import ini
import Gallery from '@/components/Gallery'
import GetInTouch from '@/components/GetInTouch'

export default async function Home() {
  return (
    <>
      {/* Section 1: Hero */}
      <Hero />

      {/* Section 2: About Us */}
      <AboutUs />

      {/* Section 3: Our Achievement */}
      <Achievements />

      {/* Section 4: Active Donation Programs */}
      <Suspense fallback={<ActiveProgramsSkeleton />}>
        <ActivePrograms />
      </Suspense>

      {/* Section 5: Finished Programs (Laporan) */}
      {/* 2. Tambahkan komponen FinishedPrograms disini */}
      {/* Kita bungkus Suspense agar tidak memblokir loading halaman utama */}
      <Suspense fallback={<div className="py-16 text-center text-gray-400">Memuat Laporan...</div>}>
        <FinishedPrograms />
      </Suspense>

      {/* Section 6: Gallery */}
      <Gallery />

      {/* Section 7: Get In Touch */}
      <GetInTouch />
    </>
  )
}