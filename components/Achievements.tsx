import { HandHeart, Users, PackageCheck } from 'lucide-react' // Contoh ikon

export default function Achievements() {
  const stats = [
    { 
      icon: <HandHeart className="h-12 w-12 text-pastel-pink-dark" />, 
      value: "Rp 1 M+", 
      label: "Donasi Terkumpul" 
    },
    { 
      icon: <Users className="h-12 w-12 text-pastel-pink-dark" />, 
      value: "1.000+", 
      label: "Penerima Manfaat" 
    },
    { 
      icon: <PackageCheck className="h-12 w-12 text-pastel-pink-dark" />, 
      value: "20+", 
      label: "Proyek Selesai" 
    },
  ]

  return (
    <section id="achievements" className="bg-pastel-yellow-dark py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
          Our Achievements
        </h2>
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="transform rounded-lg bg-white p-8 shadow-lg transition-transform hover:scale-105"
            >
              <div className="mb-4 flex justify-center">{stat.icon}</div>
              <p className="mb-2 text-4xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-lg text-gray-700">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}