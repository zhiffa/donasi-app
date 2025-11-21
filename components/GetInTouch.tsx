export default function GetInTouch() {
  const WHATSAPP_LINK = "https://wa.me/6281316902905" // Ganti dengan nomor WA Anda

  return (
    <section id="contact" className="bg-white py-16 text-center md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
          Get In Touch
        </h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg text-gray-700">
          Punya pertanyaan atau ingin berkolaborasi? Jangan ragu untuk menghubungi kami.
        </p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-green-500 py-3 px-8 font-bold text-white transition hover:bg-green-600 hover:shadow-lg"
        >
          {/* Ini adalah SVG Logo WhatsApp yang benar */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.61 15.36 3.48 16.84L2.01 21.99L7.31 20.55C8.75 21.34 10.35 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.67C16.56 3.67 20.28 7.38 20.28 11.91C20.28 16.44 16.56 20.14 12.04 20.14C10.5 20.14 9.04 19.7 7.77 18.91L7.32 18.66L3.92 19.7L5.05 16.4L4.77 15.93C3.93 14.58 3.46 13.06 3.46 11.91C3.46 7.38 7.17 3.67 12.04 3.67M17.37 14.96C17.16 15.54 16.29 16.03 15.82 16.08C15.42 16.13 14.86 16.14 14.37 15.95C13.9 15.77 13.08 15.46 12.11 14.54C10.91 13.41 10.19 12.08 9.97 11.66C9.75 11.24 9.06 10.03 9.06 9.35C9.06 8.67 9.42 8.31 9.69 8.04C9.93 7.8 10.22 7.7 10.49 7.7C10.73 7.7 10.94 7.7 11.13 7.72C11.32 7.74 11.48 7.76 11.69 8.24C11.9 8.72 12.4 10.03 12.51 10.19C12.63 10.36 12.7 10.58 12.63 10.74C12.55 10.9 12.44 11.01 12.28 11.19C12.11 11.37 12 11.48 11.84 11.65C11.68 11.82 11.51 11.96 11.71 12.23C11.91 12.51 12.42 13.29 13.16 13.97C13.99 14.74 14.68 15.08 14.97 15.2C15.27 15.31 15.52 15.28 15.71 15.08C15.93 14.85 16.16 14.52 16.4 14.28C16.64 14.04 16.92 13.98 17.21 14.09C17.5 14.2 18.23 14.59 18.45 14.8C18.67 15.01 18.78 15.13 18.81 15.25C18.84 15.37 18.84 15.75 18.63 16.33L17.37 14.96Z" />
          </svg>
          Contact Us (WhatsApp)
        </a>
      </div>
    </section>
  )
}