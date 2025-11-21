import mysql from 'mysql2/promise';

// Kode ini akan mengambil data koneksi dari file .env.local
// Pastikan kamu sudah menginstal mysql2: npm install mysql2
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Sesuaikan dengan kebutuhan
  queueLimit: 0,
});

// Ekspor koneksi pool agar bisa dipakai di API Routes
export const db = pool;

