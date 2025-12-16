'use client' // Tambahkan ini agar bisa pakai usePathname

import { Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation' // Import hook path

export default function Footer() {
  const pathname = usePathname();
  
  // Jika path diawali dengan '/admin', jangan tampilkan footer sama sekali
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          
          {/* Bagian Kiri: Logo & Deskripsi Singkat */}
          <div className="flex flex-col items-center md:items-start space-y-4 md:max-w-sm">
            <Link href="/" className="block relative h-16 w-40">
                {/* Pastikan gambar logo ada di public/logo.png */}
                <Image
                  src="/logo.png" 
                  alt="Logo Shine in Smiles" 
                  fill
                  className="object-contain object-left"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority 
                />
            </Link>
            <p className="text-center md:text-left text-sm text-gray-400 leading-relaxed italic">
              "(n) A space that brings light to those in need."
            </p>
          </div>

          {/* Bagian Kanan: Kontak & Alamat */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <h3 className="text-white font-semibold text-lg mb-2">Hubungi Kami</h3>
            
            <a 
              href="mailto:info@shinesmilesabhimata.com" 
              className="flex items-center gap-3 text-sm hover:text-white transition-colors duration-200 group"
            >
              <span>info@shinesmilesabhimata.com</span>
              <div className="p-2 bg-gray-800 rounded-full group-hover:bg-blue-600 transition-colors">
                <Mail className="h-4 w-4" />
              </div>
            </a>

            <a 
              href="tel:+62211234567" 
              className="flex items-center gap-3 text-sm hover:text-white transition-colors duration-200 group"
            >
              <span>(021) 123-4567</span>
              <div className="p-2 bg-gray-800 rounded-full group-hover:bg-green-600 transition-colors">
                <Phone className="h-4 w-4" />
              </div>
            </a>

            <div className="flex items-center gap-3 text-sm text-right group justify-end">
               <span className="max-w-[200px]">Jl. Kebaikan No. 123, Jakarta Pusat</span>
               <div className="p-2 bg-gray-800 rounded-full">
                  <MapPin className="h-4 w-4" />
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bagian Bawah: Copyright */}
      <div className="bg-gray-950 py-6 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} <span className="text-gray-300 font-medium">Shine in Smiles</span> by Yayasan Abhimata. All rights reserved.
          </p>
          
          {/* Link Tambahan (Opsional) */}
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="/about" className="hover:text-gray-300 transition-colors">Tentang Kami</Link>
            <Link href="/programs" className="hover:text-gray-300 transition-colors">Program</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}