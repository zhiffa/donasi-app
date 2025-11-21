import { Suspense } from 'react' // Impor Suspense
import Hero from '@/components/Hero'
import AboutUs from '@/components/AboutUs'
import Achievements from '@/components/Achievements'
import ActivePrograms, { ActiveProgramsSkeleton } from '@/components/ActivePrograms' // Impor Skeleton
import Gallery from '@/components/Gallery'
import GetInTouch from '@/components/GetInTouch'

// Halaman utama sekarang menjadi 'async' untuk me-load data di server
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
      {/* Bungkus ActivePrograms dengan <Suspense> 
        Ini akan menampilkan 'fallback' (UI loading) selagi
        komponen mengambil data dari backend.
      */}
      <Suspense fallback={<ActiveProgramsSkeleton />}>
        <ActivePrograms />
      </Suspense>

      {/* Section 5: Gallery & Completed Programs */}
      <Gallery />

      {/* Section 6: Get In Touch */}
      <GetInTouch />
    </>
  )
}