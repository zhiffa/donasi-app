'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X, Trash2 } from 'lucide-react'

// Interface sesuai DB Supabase
interface Program {
  id_kegiatan: number; 
  nama_program: string;
  status: 'Draft' | 'Aktif' | 'Selesai';
}

interface Expense {
  id_pengeluaran: number;
  deskripsi: string;
  type: 'uang' | 'barang';
  nominal: number | null;
  item_details: string | null;
  tanggal: string;
  id_kegiatan: number | null;
  nama_program: string | null;
  nama_admin: string; 
  created_at: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null); 

  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'uang' | 'barang'>('uang');
  const [newAmount, setNewAmount] = useState('');
  const [newItemDetails, setNewItemDetails] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]); 
  const [newProgramId, setNewProgramId] = useState('');

  const fetchExpensesAndPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [expensesRes, programsRes] = await Promise.all([
        fetch('/api/admin/expenses'),
        fetch('/api/admin/programs') 
      ]);

      if (!expensesRes.ok) {
        const data = await expensesRes.json();
        throw new Error(data.message || 'Gagal mengambil data pengeluaran');
      }
      if (!programsRes.ok) {
         const data = await programsRes.json();
        throw new Error(data.message || 'Gagal memuat daftar program');
      }

      const expensesData: Expense[] = await expensesRes.json();
      const programsData: Program[] = await programsRes.json();
      
      setExpenses(expensesData);
      // Filter hanya program aktif untuk dropdown
      setPrograms(programsData.filter(p => p.status === 'Aktif')); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchExpensesAndPrograms();
  }, [fetchExpensesAndPrograms]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null); 

    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newDescription,
          type: newType, 
          amount: newType === 'uang' ? parseFloat(newAmount) : null, 
          item_details: newType === 'barang' ? newItemDetails : null, 
          expense_date: newDate,
          id_kegiatan: newProgramId ? parseInt(newProgramId) : null
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menambah pengeluaran');
      }

      alert(data.message);
      setShowAddModal(false); 
      resetForm();
      fetchExpensesAndPrograms(); 
      
    } catch (err: any) {
      setModalError(err.message); 
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    if(confirm(`Yakin ingin menghapus data pengeluaran #${id}? Fitur ini belum terhubung.`)) {
       alert(`Fitur Hapus untuk ID ${id} belum terhubung ke API.`);
    }
  };

  const resetForm = () => {
    setNewDescription('');
    setNewType('uang');
    setNewAmount('');
    setNewItemDetails('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewProgramId('');
    setModalError(null);
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
    } catch (e) { return dateString; }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengeluaran</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          <Plus size={20} />
          Input Pengeluaran
        </button>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      )}
      {!isLoading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">Error: {error}</p>
             <button onClick={fetchExpensesAndPrograms} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
               Coba Lagi
            </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Terkait</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah / Detail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diinput oleh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length > 0 ? (
                expenses.map((exp) => (
                  <tr key={exp.id_pengeluaran}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(exp.tanggal)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exp.nama_program || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={exp.deskripsi}>{exp.deskripsi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{exp.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {exp.type === 'uang' ? (
                        <span className="text-red-600">- Rp {Number(exp.nominal).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-blue-600 truncate max-w-xs" title={exp.item_details || ''}>{exp.item_details}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exp.nama_admin || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(exp.id_pengeluaran)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Belum ada data pengeluaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal Form */}
      {showAddModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Input Pengeluaran Baru</h2>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="exp-program" className="block text-sm font-medium text-gray-700">Program Terkait (Opsional)</label>
                    <select
                      id="exp-program"
                      value={newProgramId}
                      onChange={(e) => setNewProgramId(e.target.value)}
                      className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                    >
                      <option value="">-- Tidak Terkait Program --</option>
                      {programs.map(program => (
                        <option key={program.id_kegiatan} value={program.id_kegiatan}>{program.nama_program}</option>
                      ))}
                    </select>
                 </div>
                 
                 <div>
                    <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700">Tanggal Pengeluaran</label>
                    <input
                      type="date"
                      id="exp-date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                 </div>

                 <div>
                    <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-700">Keterangan</label>
                    <textarea
                      id="exp-desc"
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Misal: Beli beras untuk dapur umum"
                      required
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700">Jenis Pengeluaran</label>
                     <div className="flex gap-4 mt-1">
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="exp-type" value="uang" checked={newType === 'uang'} onChange={() => setNewType('uang')} className="peer sr-only" />
                          <div className={`rounded-lg border-2 p-3 text-center ${newType === 'uang' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>Uang</div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="exp-type" value="barang" checked={newType === 'barang'} onChange={() => setNewType('barang')} className="peer sr-only" />
                          <div className={`rounded-lg border-2 p-3 text-center ${newType === 'barang' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>Barang</div>
                        </label>
                     </div>
                 </div>

                 {newType === 'uang' && (
                     <div>
                        <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                        <input
                          type="number"
                          id="exp-amount"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Contoh: 500000"
                          required
                        />
                     </div>
                 )}
                 {newType === 'barang' && (
                     <div>
                        <label htmlFor="exp-item" className="block text-sm font-medium text-gray-700">Detail Barang</label>
                        <input
                          type="text"
                          id="exp-item"
                          value={newItemDetails}
                          onChange={(e) => setNewItemDetails(e.target.value)}
                          className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Contoh: 5 karung beras @ 25kg"
                          required
                        />
                     </div>
                 )}
                
                 {modalError && (
                   <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-700">
                     {modalError}
                   </div>
                 )}

                 <button
                   type="submit"
                   className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400"
                   disabled={isSubmitting}
                 >
                   {isSubmitting ? (
                       <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                   ) : (
                       'Simpan Pengeluaran'
                   )}
                </button>
              </form>
            </div>
         </div>
      )}
    </div>
  )
}