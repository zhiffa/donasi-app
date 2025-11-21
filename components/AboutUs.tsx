import Image from 'next/image'

export default function AboutUs() {
  return (
    <section id="about" className="bg-white py-16 md:py-24">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        {/* Kiri: Foto */}
        <div className="overflow-hidden rounded-lg shadow-lg">
          <Image
            src="https://via.placeholder.com/600x400" // Ganti dengan foto kegiatan
            alt="Kegiatan Komunitas"
            width={600}
            height={400}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Kanan: Teks */}
        <div className="text-gray-700">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Who We Are
          </h2>
          <p className="mb-4 text-lg leading-relaxed">
            Ini adalah paragraf penjelasan singkat tentang komunitas atau yayasan Anda. 
            Jelaskan misi, visi, dan apa yang membuat komunitas Anda unik. 
            Pastikan bahasa yang digunakan profesional namun tetap hangat.
          </p>
          <p className="text-lg leading-relaxed">
            Fokus pada dampak yang telah Anda buat dan tujuan Anda ke depan. 
            Ini adalah kesempatan untuk terhubung dengan calon donatur.
          </p>
        </div>
      </div>
    </section>
  )
}