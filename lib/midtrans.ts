import midtransClient from 'midtrans-client';

// Inisialisasi Core API (Untuk backend operations)
// @ts-ignore
export const snap = new midtransClient.Snap({
  isProduction: false, // Ganti true jika sudah live production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

// Inisialisasi Core API (Untuk cek status transaksi tingkat lanjut)
export const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});