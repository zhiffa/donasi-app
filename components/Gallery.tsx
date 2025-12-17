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

        {/* Program  */}
        <h3 className="mb-6 text-center text-2xl font-bold text-gray-800">Program Kami</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card Program  */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-2 text-lg font-bold">Time to Smile</h4>
            <p className="text-gray-600">Program ini jadi kesempatan seru untuk berbagi dan menghabiskan waktu bareng.
              Dengan harapan setiap pertemuannya bisa memberikan kebahagiaan dan kenangan yang berarti untuk semuanya dan tumbuh bersama
              dalam suasana yang penuh kepedulian
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-2 text-lg font-bold">Class of Shine</h4>
            <p className="text-gray-600">Program ini adalah kesempatan untuk berbagi pengetahuan agar mereka
              bisa mendapatkan wawasan baru dengan harapan dapat memperluas pemahaman dan menambah pengetahuan
              yang bisa membantu dalam kehidupan sehari hari
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-2 text-lg font-bold">Bundle of Smile</h4>
            <p className="text-gray-600">Program ini adalah gerakan berbagi melalui open donation, dimana kamu bisa menyumbangkan 
              barang, pakaian atau makanan layak. Donasi yang terkumpul akan disalurkan langsung kepada teman-teman yang membutuhkan
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}