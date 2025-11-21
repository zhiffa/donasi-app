import { Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 h-50">
      <div className="container mx-auto flex flex-col items-center justify-between gap-8 px-4 py-12 md:flex-row md:px-6">
        
        {/* Kiri: Logo & Nama */}
        <div className="md:text-left">
          <Link href="/">
                    <Image
                      src="/logo.png" // Path ke gambar  di folder public
                      alt="Logo Komunitas" 
                      width={180} 
                      height={100} 
                      priority // Memuat logo lebih cepat (karena ada di footer)
                    />
                  </Link>
        </div>

        {/* Kanan: Info Kontak & Moto */}
        <div className="flex flex-col items-center gap-4 md:items-end">
          <p className="italic text-gray-400">"(n) A space that brings light to those in need."</p>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-pastel-pink-dark" />
            <span>info@komunitas.com</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-pastel-pink-dark" />
            <span>(021) 123-4567</span>
          </div>
        </div>

      </div>
      <div className="border-t border-gray-700 py-4 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Shine in Smiles Yayasan XYZ. All rights reserved.
        </p>
      </div>
    </footer>
  )
}