import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // 1. Ambil Detail Program
    const { data: program, error: progError } = await supabase
      .from('kegiatan')
      .select('*')
      .eq('id_kegiatan', id)
      .single();

    if (progError) throw new Error('Program tidak ditemukan');

    // 2. Ambil Statistik
    const { data: stats, error: statsError } = await supabase
      .rpc('get_program_summary', { p_program_id: id });

    if (statsError) throw statsError;

    // 3. Ambil Riwayat Pemasukan
    const { data: rawIncome, error: incomeError } = await supabase
      .from('donasi')
      .select('nominal, created_at, anonim, jenis_donasi') 
      .eq('id_kegiatan', id)
      .eq('status', 'Diterima')
      .gt('nominal', 0)
      .order('created_at', { ascending: false });

    if (incomeError) {
      console.error("Error Fetching Income:", incomeError);
    }

    // --- PERUBAHAN DISINI ---
    // Kita tambahkan field 'nama_donatur' manual dengan isi "Donatur" untuk semua data.
    const formattedIncome = rawIncome ? rawIncome.map((item) => ({
        ...item,
        nama_donatur: 'Donatur' // Set nama default jadi "Donatur"
    })) : [];

    // 4. Ambil Riwayat Pengeluaran
    const { data: expenses, error: expenseError } = await supabase
      .from('pengeluaran')
      .select('deskripsi, nominal, tanggal, item_details, type')
      .eq('id_kegiatan', id)
      .order('tanggal', { ascending: false });

    return NextResponse.json({
      program,
      stats: stats ? stats[0] : null,
      income: formattedIncome, // Kirim data yang sudah ada namanya
      expenses: expenses || []
    }, { status: 200 });

  } catch (error: any) {
    console.error("[REPORT_API_ERROR]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}