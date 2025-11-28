import Image from 'next/image'

export default function AboutUs() {
  return (
    <section id="about" className="bg-white py-16 md:py-24">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        {/* Kiri: Foto */}
        <div className="overflow-hidden rounded-lg shadow-lg">
          <Image
            src="/img1.png" 
            alt="Kegiatan Komunitas"
            width={600}
            height={400}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Kanan: Teks */}
        <div className="text-gray-700">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Who We Are?
          </h2>
          <p className="mb-4 text-lg leading-relaxed">
           Shine in Smiles adalah komunitas sosial dibawah naungan Yayasan Abhimata
           yang berfokus pada kegiatan berbagi, mengajar, dan aksi sosial untuk membawa 
           kebahagiaan serta harapan bagi mereka yang membutuhkan. 
          </p>
          <p className="text-lg leading-relaxed">
            Dengan semangat kepedulian, komunitas ini berusaha menciptakan lingkungan yang suportif, 
            inklusif, dan penuh kehangatan, di mana setiap senyuman yang terukir menjadi 
            simbol dari dampak positif yang diberikan.
          </p>
        </div>
      </div>
    </section>
  )
}