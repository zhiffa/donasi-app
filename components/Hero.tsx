import Link from 'next/link'

export default function Hero() {
  return (
    <section 
      id="home" 
      className="relative flex h-screen items-center justify-center bg-cover bg-center"
      
      /* Ini adalah satu-satunya komentar yang diperlukan untuk mematikan error ESLint */
      /* eslint-disable-next-line @next/next/no-inline-styles */
      style={{ backgroundImage: "url(/login.jpg)" }}
    >
      {/* Overlay untuk keterbacaan teks */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative z-10 text-center text-white">
        <h1 className="mb-4 text-5xl font-bold md:text-7xl">
          Shine in Smiles
        </h1>
        <p className="mb-8 text-lg md:text-xl">
         By Yayasan Abhimata
        </p>
        <p className="mb-8 text-lg md:text-xl">
          A space that brings light to those in need.
        </p>
        <Link 
          href="/#donate"
          className="rounded-full bg-pastel-pink-dark px-8 py-3 font-bold text-gray-900 transition hover:bg-pastel-pink-light hover:shadow-lg"
        >
          Donasi Sekarang
        </Link>
      </div>
    </section>
  )
}