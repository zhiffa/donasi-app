'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// Tambahkan icon Download
import { Plus, Loader2, X, Trash2, Filter, Download } from 'lucide-react'

// --- Interfaces ---
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
  // --- State Management ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Inputs
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'uang' | 'barang'>('uang');
  const [newAmount, setNewAmount] = useState('');
  const [newItemDetails, setNewItemDetails] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProgramId, setNewProgramId] = useState('');

  // --- Fetch Data ---
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
      
      // PERUBAHAN 1: Jangan difilter di sini. Simpan SEMUA program (Aktif & Selesai)
      // agar filter utama bisa menampilkan program lama untuk keperluan export history.
      setPrograms(programsData); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpensesAndPrograms();
  }, [fetchExpensesAndPrograms]);

  // --- Filter Logic ---
  const filteredExpenses = expenses.filter(exp => {
    if (selectedProgramId === '') return true;
    if (selectedProgramId === 'null') return exp.id_kegiatan === null;
    return exp.id_kegiatan?.toString() === selectedProgramId;
  });

  // --- PERUBAHAN 2: Handle Export CSV ---
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    // Header CSV
    const headers = ['Tanggal', 'Program Terkait', 'Keterangan', 'Jenis', 'Nominal (Rp)', 'Detail Barang', 'Diinput Oleh'];
    
    // Convert data ke string CSV
    const csvRows = filteredExpenses.map(exp => {
      // Handle koma dalam teks agar tidak merusak format CSV (bungkus pakai kutip)
      const cleanDesc = `"${exp.deskripsi.replace(/"/g, '""')}"`; 
      const cleanProgram = exp.nama_program ? `"${exp.nama_program.replace(/"/g, '""')}"` : '"Non-Program"';
      const cleanItem = exp.item_details ? `"${exp.item_details.replace(/"/g, '""')}"` : '-';
      
      return [
        exp.tanggal,
        cleanProgram,
        cleanDesc,
        exp.type.toUpperCase(),
        exp.type === 'uang' ? exp.nominal : 0,
        cleanItem,
        exp.nama_admin
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-pengeluaran-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- Handlers ---
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
      if (!res.ok) throw new Error(data.message || 'Gagal menambah pengeluaran');

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
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/expenses?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus data');
      }

      alert('Data berhasil dihapus!');
      fetchExpensesAndPrograms(); 

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan saat menghapus data.');
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

  // --- Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengeluaran</h1>
        
        {/* Action Group: Filter & Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dropdown Filter */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <option value="">Semua Program</option>
              <option value="null">-- Non-Program --</option>
              {/* Di sini semua program muncul (termasuk yang selesai) agar bisa difilter & diekspor */}
              {programs.map((prog) => (
                <option key={prog.id_kegiatan} value={prog.id_kegiatan}>
                  {prog.nama_program} {prog.status !== 'Aktif' ? `(${prog.status})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* PERUBAHAN 3: Tombol Export */}
          <button
            onClick={handleExportCSV}
            disabled={filteredExpenses.length === 0}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition duration-200 shadow-sm whitespace-nowrap"
            title="Export data ke CSV (Excel)"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            Input Pengeluaran
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center mb-6">
          <p className="text-red-600">Error: {error}</p>
          <button onClick={fetchExpensesAndPrograms} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Coba Lagi
          </button>
        </div>
      )}

      {/* Table Data */}
      {!isLoading && !error && (
        <div className="overflow-x-auto border rounded-lg border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Terkait</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah / Detail</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Diinput oleh</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id_pengeluaran} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(exp.tanggal)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{exp.nama_program || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={exp.deskripsi}>{exp.deskripsi}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${exp.type === 'uang' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {exp.type === 'uang' ? (
                        <span className="text-red-600">- Rp {Number(exp.nominal).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-blue-600 truncate block max-w-xs" title={exp.item_details || ''}>{exp.item_details}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.nama_admin || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(exp.id_pengeluaran)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {selectedProgramId === ''
                      ? 'Belum ada data pengeluaran.'
                      : 'Tidak ada data pengeluaran untuk filter ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">Input Pengeluaran Baru</h2>

            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div>
                <label htmlFor="exp-program" className="block text-sm font-medium text-gray-700 mb-1">Program Terkait (Opsional)</label>
                <select
                  id="exp-program"
                  value={newProgramId}
                  onChange={(e) => setNewProgramId(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                >
                  <option value="">-- Tidak Terkait Program --</option>
                  
                  {/* PERUBAHAN 4: Hanya tampilkan program AKTIF di form input */}
                  {programs
                    .filter(p => p.status === 'Aktif')
                    .map(program => (
                      <option key={program.id_kegiatan} value={program.id_kegiatan}>
                        {program.nama_program}
                      </option>
                  ))}
                </select>
              </div>

              {/* ... SISA FORM TIDAK BERUBAH SAMA SEKALI ... */}
              <div>
                <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  id="exp-date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                  required
                />
              </div>

              <div>
                <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea
                  id="exp-desc"
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                  placeholder="Contoh: Beli konsumsi rapat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pengeluaran</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <input type="radio" name="exp-type" value="uang" checked={newType === 'uang'} onChange={() => setNewType('uang')} className="peer sr-only" />
                    <div className="rounded-lg border-2 p-3 text-center transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 border-gray-200 text-gray-500 hover:bg-gray-50">
                      Uang
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer group">
                    <input type="radio" name="exp-type" value="barang" checked={newType === 'barang'} onChange={() => setNewType('barang')} className="peer sr-only" />
                    <div className="rounded-lg border-2 p-3 text-center transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 border-gray-200 text-gray-500 hover:bg-gray-50">
                      Barang
                    </div>
                  </label>
                </div>
              </div>

              {newType === 'uang' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                  <input
                    type="number"
                    id="exp-amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                    placeholder="500000"
                    required
                  />
                </div>
              )}
              {newType === 'barang' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label htmlFor="exp-item" className="block text-sm font-medium text-gray-700 mb-1">Detail Barang</label>
                  <input
                    type="text"
                    id="exp-item"
                    value={newItemDetails}
                    onChange={(e) => setNewItemDetails(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                    placeholder="Contoh: 5 Dus Air Mineral"
                    required
                  />
                </div>
              )}

              {modalError && (
                <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 border border-red-100">
                  {modalError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Menyimpan...
                  </div>
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