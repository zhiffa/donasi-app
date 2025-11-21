'use client'
import { useState, useEffect } from 'react'
import { TrendingDown, Loader2, FileText } from 'lucide-react'

interface PublicExpense {
  id_pengeluaran: number;
  deskripsi: string;
  nominal: number | null;
  item_details: string | null;
  type: 'uang' | 'barang';
  tanggal: string;
}

export default function PengeluaranDana({ programId }: { programId: string }) {
  const [expenses, setExpenses] = useState<PublicExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch(`/api/public/expenses/${programId}`);
        if (res.ok) {
          const data = await res.json();
          setExpenses(data);
        }
      } catch (error) {
        console.error("Failed to fetch public expenses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [programId]);

  const totalExpenses = expenses
    .filter(e => e.type === 'uang' && e.nominal)
    .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-red-800">Penggunaan Dana</h3>
        <div className="text-sm font-medium text-red-600 bg-white px-3 py-1 rounded-full border border-red-100">
          Total: Rp {totalExpenses.toLocaleString('id-ID')}
        </div>
      </div>
      
      <div className="p-0 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data pengeluaran yang tercatat.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <li key={e.id_pengeluaran} className="p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-800 flex-1">{e.deskripsi}</p>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                    {new Date(e.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText size={16} className="text-gray-400"/>
                      <span className="capitalize">{e.type}</span>
                   </div>
                   
                   {e.type === 'uang' ? (
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded text-sm">
                        - Rp {Number(e.nominal).toLocaleString('id-ID')}
                      </span>
                   ) : (
                      <span className="font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm truncate max-w-[150px]">
                        {e.item_details}
                      </span>
                   )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}