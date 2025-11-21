import Image from 'next/image'

export default function Gallery() {
  // Data dummy (ganti dengan foto Anda)
  const galleryImages = [
    '/program1.png',
    '/program2.png',
    '/program3.png',
    '/program1.png',
  ]

  return (
    <section id="programs" className="bg-pastel-yellow-dark py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
          Gallery
        </h2>
        
        {/* Galeri Foto */}
        <p className="mb-6 text-center text-lg text-gray-700">Dokumentasi kegiatan kami.</p>
        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {galleryImages.map((src, index) => (
            <div key={index} className="overflow-hidden rounded-lg shadow-lg">
              <Image
                src={src} // Ganti dengan path gambar
                alt={`Gallery Image ${index + 1}`}
                width={300}
                height={300}
                className="h-full w-full object-cover transition-transform hover:scale-110"
              />
            </div>
          ))}
        </div>

        {/* Program Selesai (bisa gunakan ProgramCard atau layout lain) */}
        <h3 className="mb-6 text-center text-2xl font-bold text-gray-800">Program yang Telah Selesai</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Contoh Card Program Selesai */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-2 text-lg font-bold">Griya Yatim & Dhuafa</h4>
            <p className="text-gray-600">Distribusi paket sembako pada Maret 2025.</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-2 text-lg font-bold">Taman Baca Masyarakat</h4>
            <p className="text-gray-600">Memberikan kelas pengajaran dan pembagian souvenir untuk setiap adik.</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-2 text-lg font-bold">Qurban 1445 H</h4>
            <p className="text-gray-600">Penyembelihan dan distribusi 5 ekor kambing.</p>
          </div>
        </div>
      </div>
    </section>
  )
}