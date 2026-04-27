-- Jalankan file ini satu kali di Supabase SQL Editor sebelum menjalankan aplikasi.
-- Catatan: DROP TABLE di bawah aman untuk project baru. Jangan jalankan ulang jika database sudah berisi data penting.

drop table if exists vendor_payments cascade;
drop table if exists participant_payments cascade;
drop table if exists other_incomes cascade;
drop table if exists expenses cascade;
drop table if exists participants cascade;
drop table if exists settings_kegiatan cascade;

create table settings_kegiatan (
  id text primary key default 'main',
  nama_kegiatan text not null,
  jumlah_pembimbing integer not null default 0,
  iuran_default_santri bigint not null default 0,
  akun_tujuan text default '',
  rekening_tujuan text default '',
  catatan_kegiatan text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table participants (
  id text primary key,
  nama text not null,
  kelas text default '',
  kamar text default '',
  target_iuran bigint not null default 0,
  catatan text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table participant_payments (
  id text primary key,
  participant_id text not null references participants(id) on delete cascade,
  tanggal date,
  nominal bigint not null default 0,
  metode text default 'Transfer',
  akun_masuk text default '',
  catatan text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expenses (
  id text primary key,
  nama text not null,
  kategori text default 'Lainnya',
  vendor text default '',
  nominal bigint not null default 0,
  jatuh_tempo date,
  catatan text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendor_payments (
  id text primary key,
  expense_id text references expenses(id) on delete set null,
  vendor_snapshot text default '',
  jenis text default 'DP',
  tanggal date,
  metode text default 'Transfer',
  akun_tujuan text default '',
  nominal bigint not null default 0,
  biaya_admin bigint not null default 0,
  bukti_nama text default '',
  bukti_data_url text default '',
  catatan text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table other_incomes (
  id text primary key,
  nama text not null,
  sumber text default 'Lainnya',
  tanggal date,
  metode text default 'Transfer',
  akun_masuk text default '',
  nominal bigint not null default 0,
  catatan text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table settings_kegiatan enable row level security;
alter table participants enable row level security;
alter table participant_payments enable row level security;
alter table expenses enable row level security;
alter table vendor_payments enable row level security;
alter table other_incomes enable row level security;

-- Policy awal untuk fase single-user tanpa login.
-- Setelah login/role ditambahkan, policy ini sebaiknya diperketat.
create policy "Allow anon access settings" on settings_kegiatan for all to anon using (true) with check (true);
create policy "Allow anon access participants" on participants for all to anon using (true) with check (true);
create policy "Allow anon access participant_payments" on participant_payments for all to anon using (true) with check (true);
create policy "Allow anon access expenses" on expenses for all to anon using (true) with check (true);
create policy "Allow anon access vendor_payments" on vendor_payments for all to anon using (true) with check (true);
create policy "Allow anon access other_incomes" on other_incomes for all to anon using (true) with check (true);
