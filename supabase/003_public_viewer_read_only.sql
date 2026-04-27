-- Public viewer mode: anyone can read application data, only admin/bendahara can change it.
-- Run this after the React UI has been deployed and tested.

create or replace function public.can_manage_rihlah()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'bendahara')
  );
$$;

alter table public.participants enable row level security;
alter table public.participant_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.vendor_payments enable row level security;
alter table public.other_incomes enable row level security;
alter table public.settings_kegiatan enable row level security;

-- Remove old broad policies if present.
drop policy if exists "Allow authenticated access participants" on public.participants;
drop policy if exists "Allow authenticated access participant_payments" on public.participant_payments;
drop policy if exists "Allow authenticated access expenses" on public.expenses;
drop policy if exists "Allow authenticated access vendor_payments" on public.vendor_payments;
drop policy if exists "Allow authenticated access other_incomes" on public.other_incomes;
drop policy if exists "Allow authenticated access settings_kegiatan" on public.settings_kegiatan;

drop policy if exists "Allow public read participants" on public.participants;
drop policy if exists "Allow public read participant_payments" on public.participant_payments;
drop policy if exists "Allow public read expenses" on public.expenses;
drop policy if exists "Allow public read vendor_payments" on public.vendor_payments;
drop policy if exists "Allow public read other_incomes" on public.other_incomes;
drop policy if exists "Allow public read settings_kegiatan" on public.settings_kegiatan;

drop policy if exists "Allow admin bendahara insert participants" on public.participants;
drop policy if exists "Allow admin bendahara update participants" on public.participants;
drop policy if exists "Allow admin bendahara delete participants" on public.participants;
drop policy if exists "Allow admin bendahara insert participant_payments" on public.participant_payments;
drop policy if exists "Allow admin bendahara update participant_payments" on public.participant_payments;
drop policy if exists "Allow admin bendahara delete participant_payments" on public.participant_payments;
drop policy if exists "Allow admin bendahara insert expenses" on public.expenses;
drop policy if exists "Allow admin bendahara update expenses" on public.expenses;
drop policy if exists "Allow admin bendahara delete expenses" on public.expenses;
drop policy if exists "Allow admin bendahara insert vendor_payments" on public.vendor_payments;
drop policy if exists "Allow admin bendahara update vendor_payments" on public.vendor_payments;
drop policy if exists "Allow admin bendahara delete vendor_payments" on public.vendor_payments;
drop policy if exists "Allow admin bendahara insert other_incomes" on public.other_incomes;
drop policy if exists "Allow admin bendahara update other_incomes" on public.other_incomes;
drop policy if exists "Allow admin bendahara delete other_incomes" on public.other_incomes;
drop policy if exists "Allow admin bendahara insert settings_kegiatan" on public.settings_kegiatan;
drop policy if exists "Allow admin bendahara update settings_kegiatan" on public.settings_kegiatan;
drop policy if exists "Allow admin bendahara delete settings_kegiatan" on public.settings_kegiatan;

-- Public read policies.
create policy "Allow public read participants" on public.participants for select to anon, authenticated using (true);
create policy "Allow public read participant_payments" on public.participant_payments for select to anon, authenticated using (true);
create policy "Allow public read expenses" on public.expenses for select to anon, authenticated using (true);
create policy "Allow public read vendor_payments" on public.vendor_payments for select to anon, authenticated using (true);
create policy "Allow public read other_incomes" on public.other_incomes for select to anon, authenticated using (true);
create policy "Allow public read settings_kegiatan" on public.settings_kegiatan for select to anon, authenticated using (true);

-- Admin/bendahara write policies.
create policy "Allow admin bendahara insert participants" on public.participants for insert to authenticated with check (public.can_manage_rihlah());
create policy "Allow admin bendahara update participants" on public.participants for update to authenticated using (public.can_manage_rihlah()) with check (public.can_manage_rihlah());
create policy "Allow admin bendahara delete participants" on public.participants for delete to authenticated using (public.can_manage_rihlah());

create policy "Allow admin bendahara insert participant_payments" on public.participant_payments for insert to authenticated with check (public.can_manage_rihlah());
create policy "Allow admin bendahara update participant_payments" on public.participant_payments for update to authenticated using (public.can_manage_rihlah()) with check (public.can_manage_rihlah());
create policy "Allow admin bendahara delete participant_payments" on public.participant_payments for delete to authenticated using (public.can_manage_rihlah());

create policy "Allow admin bendahara insert expenses" on public.expenses for insert to authenticated with check (public.can_manage_rihlah());
create policy "Allow admin bendahara update expenses" on public.expenses for update to authenticated using (public.can_manage_rihlah()) with check (public.can_manage_rihlah());
create policy "Allow admin bendahara delete expenses" on public.expenses for delete to authenticated using (public.can_manage_rihlah());

create policy "Allow admin bendahara insert vendor_payments" on public.vendor_payments for insert to authenticated with check (public.can_manage_rihlah());
create policy "Allow admin bendahara update vendor_payments" on public.vendor_payments for update to authenticated using (public.can_manage_rihlah()) with check (public.can_manage_rihlah());
create policy "Allow admin bendahara delete vendor_payments" on public.vendor_payments for delete to authenticated using (public.can_manage_rihlah());

create policy "Allow admin bendahara insert other_incomes" on public.other_incomes for insert to authenticated with check (public.can_manage_rihlah());
create policy "Allow admin bendahara update other_incomes" on public.other_incomes for update to authenticated using (public.can_manage_rihlah()) with check (public.can_manage_rihlah());
create policy "Allow admin bendahara delete other_incomes" on public.other_incomes for delete to authenticated using (public.can_manage_rihlah());

create policy "Allow admin bendahara insert settings_kegiatan" on public.settings_kegiatan for insert to authenticated with check (public.can_manage_rihlah());
create policy "Allow admin bendahara update settings_kegiatan" on public.settings_kegiatan for update to authenticated using (public.can_manage_rihlah()) with check (public.can_manage_rihlah());
create policy "Allow admin bendahara delete settings_kegiatan" on public.settings_kegiatan for delete to authenticated using (public.can_manage_rihlah());

-- Storage: public can view vendor proofs, only admin/bendahara can upload/update/delete.
update storage.buckets
set public = false
where id = 'vendor-payment-proofs';

drop policy if exists "Allow authenticated read vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow authenticated upload vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow authenticated update vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow authenticated delete vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow public read vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow admin bendahara upload vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow admin bendahara update vendor-payment-proofs" on storage.objects;
drop policy if exists "Allow admin bendahara delete vendor-payment-proofs" on storage.objects;

create policy "Allow public read vendor-payment-proofs"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'vendor-payment-proofs');

create policy "Allow admin bendahara upload vendor-payment-proofs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'vendor-payment-proofs' and public.can_manage_rihlah());

create policy "Allow admin bendahara update vendor-payment-proofs"
on storage.objects
for update
to authenticated
using (bucket_id = 'vendor-payment-proofs' and public.can_manage_rihlah())
with check (bucket_id = 'vendor-payment-proofs' and public.can_manage_rihlah());

create policy "Allow admin bendahara delete vendor-payment-proofs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'vendor-payment-proofs' and public.can_manage_rihlah());
