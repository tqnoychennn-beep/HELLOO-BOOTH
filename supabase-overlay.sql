-- Jalankan di SQL Editor project Supabase yang sama dengan V7.
-- Buat satu user admin di Authentication > Users terlebih dahulu.
-- Ganti UUID_ADMIN_KAMU dengan UUID user admin dari Authentication > Users.
-- Policy ini hanya mengizinkan user admin dengan UUID tersebut mengubah overlay.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('overlays', 'overlays', false, 10485760, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/png'];

create policy "Overlay PNG bisa dibaca publik"
on storage.objects for select to anon, authenticated
using (bucket_id = 'overlays');

create policy "Hanya admin upload overlay"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'overlays'
  and (select auth.uid()) = 'UUID_ADMIN_KAMU'::uuid
  and name in ('wedding.png', 'birthday.png', 'corporate.png')
);

create policy "Hanya admin ganti overlay"
on storage.objects for update to authenticated
using (
  bucket_id = 'overlays'
  and (select auth.uid()) = 'UUID_ADMIN_KAMU'::uuid
  and name in ('wedding.png', 'birthday.png', 'corporate.png')
)
with check (
  bucket_id = 'overlays'
  and (select auth.uid()) = 'UUID_ADMIN_KAMU'::uuid
  and name in ('wedding.png', 'birthday.png', 'corporate.png')
);
