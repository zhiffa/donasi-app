'use client'
import { useEffect, useState } from 'react'
import { DollarSign, Users, Calendar, ListTodo, Package, Truck, CheckCircle, Clock } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Components (Tidak Berubah) ---

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subValue?: string;
  bgColorClass: string;
  iconColorClass: string;
}

function StatCard({ icon, title, value, subValue, bgColorClass, iconColorClass }: StatCardProps) {
  return (
    <div className={`rounded-xl shadow-sm border border-gray-100 p-6 ${bgColorClass} h-full`}>
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full bg-white shadow-sm ${iconColorClass}`}>
          {icon}
        </div>
        {subValue && <span className="text-xs font-semibold px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">{subValue}</span>}
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Gagal load analytics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Gagal memuat data.</div>;

  const COLORS = ['#3b82f6', '#f59e0b']; 

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Update terakhir: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* --- ROW 1: Statistik Utama --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<DollarSign size={24} />}
          title="Total Uang Masuk"
          value={`Rp ${data.totalDonations.toLocaleString('id-ID')}`}
          bgColorClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          icon={<Users size={24} />}
          title="Total User Terdaftar"
          value={data.totalUsers}
          subValue={`${data.totalDonors} Donatur Aktif`}
          bgColorClass="bg-blue-50"
          iconColorClass="text-blue-600"
        />
        <StatCard
          icon={<ListTodo size={24} />}
          title="Verifikasi Barang (Pending)"
          value={`${data.todoListCount} Item`}
          bgColorClass="bg-purple-50"
          iconColorClass="text-purple-600"
        />
        <StatCard
          icon={<Calendar size={24} />}
          title="Program Berjalan"
          value={data.ongoingEvents}
          subValue={`Dari ${data.totalEvents} Total`}
          bgColorClass="bg-orange-50"
          iconColorClass="text-orange-600"
        />
      </div>

      {/* --- ROW 2: Info Pengiriman & Komposisi --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM 1 */}
          <StatCard
            icon={<Package size={24} />}
            title="Donasi Antar Sendiri"
            value={`${data.trackingStats?.selfDelivery || 0} Donatur`}
            subValue="Menunggu diantar ke yayasan"
            bgColorClass="bg-teal-50"
            iconColorClass="text-teal-600"
          />

          {/* KOLOM 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Truck size={16}/> Status Pick-up
                </h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-blue-500"/>
                            <span className="text-xs font-medium text-gray-600">Dijadwalkan</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{data.trackingStats.dijadwalkan}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <div className="flex items-center gap-2">
                            <Truck size={14} className="text-orange-500"/>
                            <span className="text-xs font-medium text-gray-600">Jalan</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{data.trackingStats.diantar}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500"/>
                            <span className="text-xs font-medium text-gray-600">Selesai</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{data.trackingStats.selesai}</span>
                    </div>
                </div>
            </div>

            {/* KOLOM 3: Pie Chart (FIXED FOR MOBILE) */}
            {/* Hapus 'h-full'. Ganti dengan styling yang tidak tergantung parent flex di mobile */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Komposisi Donasi</h2>
                
                {/* Pastikan wrapper ini punya tinggi yang fix (pixel) agar responsive container bekerja */}
                <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.pieData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                        <Package size={24} className="text-gray-400 opacity-50"/>
                    </div>
                </div>
            </div>
      </div>

      {/* --- ROW 3: Grafik Tren Donasi 30 HARI --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Tren Donasi Masuk (30 Hari Terakhir)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 10}} 
                    dy={10}
                    // minTickGap mencegah tulisan tanggal bertumpuk
                    minTickGap={15} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 12}} 
                    tickFormatter={(value) => `Rp${(value/1000)}k`}
                />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Jumlah']}
                    labelStyle={{color: '#374151', fontWeight: 'bold'}}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

    </div>
  )
}