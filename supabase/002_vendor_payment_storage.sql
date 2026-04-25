-- Jalankan query ini di Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('vendor-payment-proofs', 'vendor-payment-proofs', true)
on conflict (id) do nothing;

create policy if not exists "Public can view vendor payment proofs"
on storage.objects
for select
to public
using (bucket_id = 'vendor-payment-proofs');

create policy if not exists "Anon/authenticated can upload vendor payment proofs"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'vendor-payment-proofs');

create policy if not exists "Anon/authenticated can update vendor payment proofs"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'vendor-payment-proofs')
with check (bucket_id = 'vendor-payment-proofs');

create policy if not exists "Anon/authenticated can delete vendor payment proofs"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'vendor-payment-proofs');

alter table vendor_payments
add column if not exists bukti_path text default '';
