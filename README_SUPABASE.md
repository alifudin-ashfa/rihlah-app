# Setup Supabase untuk Rihlah

1. Buka Supabase Dashboard project Anda.
2. Masuk ke **SQL Editor**.
3. Buka file `supabase/001_create_rihlah_schema.sql`, salin semua isinya, lalu klik **Run** di SQL Editor.
4. Pastikan file `.env.local` berisi:

```env
VITE_SUPABASE_URL=https://jlimaimemdjmqdbsxtsi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_HvyDblEAdBjzM8xEL9TyiA_nvRb__ph
```

5. Jalankan aplikasi:

```bash
npm install
npm run dev
```

Catatan: policy database saat ini dibuat terbuka untuk fase awal tanpa login. Setelah fitur login dibuat, policy perlu diperketat agar data hanya bisa diakses user yang berhak.
