# Perubahan UI/UX, Product, dan QA

Berikut perubahan yang diterapkan berdasarkan audit:

## Akses dan navigasi
- Judul login diubah dari "Login Admin" menjadi "Login Pengelola" agar sesuai untuk Admin dan Bendahara.
- Form login ditambah tombol tampil/sembunyikan password.
- Pesan error login dibuat lebih ramah pengguna.
- Navbar dibuat lebih ringkas untuk mobile dengan nama "Rihlah Al Yaqut".
- Badge role dibuat lebih jelas: Pelihat, Admin, atau Bendahara.
- Status penyimpanan/database ditampilkan di navbar desktop dan menu mobile.

## Validasi dan keamanan data
- Validasi santri: nama wajib, target iuran harus lebih dari 0.
- Validasi pembayaran iuran: santri wajib dipilih, tanggal wajib, nominal harus lebih dari 0.
- Validasi tagihan vendor: nama tagihan wajib, vendor wajib, nominal harus lebih dari 0.
- Validasi pemasukan lain: nama wajib, tanggal wajib, nominal harus lebih dari 0.
- Validasi pembayaran vendor: vendor/tagihan wajib, tanggal wajib, nominal harus lebih dari 0.

## Konfirmasi aksi berbahaya
- Hapus santri wajib mengetik `HAPUS`.
- Hapus tagihan vendor wajib mengetik `HAPUS`.
- Import backup wajib mengetik `IMPORT` setelah melihat ringkasan isi file.
- Reset semua data wajib mengetik `RESET`.
- Load data contoh wajib mengetik `CONTOH`.
- Hapus pembayaran/pemasukan memakai dialog konfirmasi yang lebih informatif.

## Perbaikan form dan mobile UX
- Input nominal diberi `inputMode="numeric"` dan `min="0"`.
- Placeholder nominal dibuat lebih jelas, misalnya `Contoh: 500000`.
- Helper text ditambahkan pada target iuran dan nominal pembayaran iuran.
- Beberapa style berat seperti `font-black` dikurangi pada login/navbar agar tampil lebih profesional.

## Catatan pengujian
- Source JSX sudah dicek parse menggunakan Babel parser.
- Build Vite tidak bisa dijalankan di environment ini karena `node_modules` dari ZIP asli tidak lengkap/terpotong saat ekstraksi dan dependency tidak bisa dipasang penuh tanpa akses jaringan. Jalankan `npm install` lalu `npm run build` di komputer lokal sebelum deploy.

## v1.2-buku-kas-export

Tanggal: 2026-04-27

### Fitur baru

- Menambahkan halaman **Buku Kas**.
- Menambahkan menu **Buku Kas** di navigasi utama.
- Menampilkan transaksi dari:
  - pembayaran iuran santri,
  - pemasukan lain,
  - pembayaran vendor.
- Menambahkan ringkasan:
  - Total Masuk,
  - Total Keluar,
  - Saldo,
  - Jumlah Transaksi.
- Menambahkan filter:
  - tanggal mulai,
  - tanggal akhir,
  - tipe transaksi,
  - pencarian transaksi.
- Menambahkan tampilan mobile untuk daftar transaksi Buku Kas.
- Menambahkan export Buku Kas ke **Excel**.
- Menambahkan export Buku Kas ke **PDF**.

### Perbaikan

- Memperbaiki sumber data Buku Kas agar membaca struktur data aplikasi yang benar.
- Memperbaiki mode tampilan agar Pelihat terbaca sebagai **Pelihat / Read-only**.
- Menyesuaikan transaksi Buku Kas agar membaca:
  - `participants[].payments`,
  - `otherIncomes`,
  - `vendorPayments`.
- Menambahkan saldo berjalan pada setiap transaksi.
- Menonaktifkan tombol export jika belum ada transaksi.

### Catatan teknis

- Menambahkan file:
  - `src/features/cashbook/BukuKasPage.jsx`
  - `src/shared/lib/cashbookBuilder.js`
  - `src/shared/lib/exportExcel.js`
  - `src/shared/lib/exportPdf.js`
- Menambahkan dependency:
  - `xlsx`
  - `jspdf`
  - `jspdf-autotable`