import { DollarSign, Users, UserPlus, Server, ListTodo, AlertTriangle, BookAIcon, Signal } from 'lucide-react' // Import ikon yang relevan

// Komponen Card Statistik (agar kode utama lebih rapi)
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string; // Teks perubahan (misal: "+2.5%")
  bgColorClass: string; // Kelas warna background Tailwind
  iconColorClass: string; // Kelas warna ikon Tailwind
}

function StatCard({ icon, title, value, change, bgColorClass, iconColorClass }: StatCardProps) {
  return (
    <div className={`rounded-lg shadow-md p-6 ${bgColorClass}`}>
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${iconColorClass} bg-opacity-20`}>
          {icon}
        </div>
        {change && <span className="text-sm font-medium text-gray-700">{change} ▲</span>}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Halaman Utama Dashboard Admin
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Judul Halaman */}
      <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<Signal size={24} />}
          title="Total Donations"
          value="Rp 3.249.000"
          change="+2.5%"
          bgColorClass="bg-green-100"
          iconColorClass="text-green-600"
        />
        <StatCard
          icon={<Users size={24} />}
          title="Total Users"
          value="249"
          change="-0.5%" // Contoh perubahan negatif (bisa diubah ikonnya nanti)
          bgColorClass="bg-pink-100"
          iconColorClass="text-pink-600"
        />
        <StatCard
          icon={<UserPlus size={24} />}
          title="New Users"
          value="2"
          bgColorClass="bg-yellow-100"
          iconColorClass="text-yellow-600"
        />
 
         <StatCard
          icon={<ListTodo size={24} />}
          title="To Do List"
          value="7 tasks"
          bgColorClass="bg-purple-100"
          iconColorClass="text-purple-600"
        />
         <StatCard
          icon={<BookAIcon size={24} />}
          title="Total Doantion Stuff"
          value="100 items"
          change="+1"
          bgColorClass="bg-red-100"
          iconColorClass="text-red-600"
        />
        {/* Tambahkan kartu lain jika perlu */}
      </div>

      {/* Grid Placeholder Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Page Impressions vs Adsense Clicks</h2>
          <div className="h-60 bg-gray-200 rounded flex items-center justify-center text-gray-500">
            {/* Ganti dengan komponen chart */}
            Graph Placeholder 1
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Views Over Time</h2>
          <div className="h-60 bg-gray-200 rounded flex items-center justify-center text-gray-500">
            {/* Ganti dengan komponen chart */}
            Graph Placeholder 2
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Likes Distribution</h2>
          <div className="h-60 bg-gray-200 rounded flex items-center justify-center text-gray-500">
             {/* Ganti dengan komponen chart */}
             Graph Placeholder 3
          </div>
        </div>
        {/* Tambahkan placeholder grafik lain jika perlu */}
      </div>
    </div>
  )
}

