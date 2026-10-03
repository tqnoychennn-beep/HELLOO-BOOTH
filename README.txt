HELLOO.BOOTH V8 — UPLOAD OVERLAY PORTRAIT 10 x 15 cm / 300 DPI

PENTING: Ini versi baru terpisah. Jangan timpa V7 sampai V8 berhasil dites.

1. Buat user admin lewat Supabase > Authentication > Users.
2. Di supabase-overlay.sql, ganti UUID_ADMIN_KAMU dengan UUID user admin dari Authentication > Users.
   Jalankan SQL sekali di Supabase SQL Editor. Jika policy sudah pernah dibuat, jangan jalankan ulang CREATE POLICY.
3. Salin config.example.js menjadi config.js. Isi URL, publishable key, dan nama bucket FOTO yang sama dengan V7.
4. Deploy index.html, style.css, app.js, config.js ke Vercel sebagai proyek baru.
5. Di website, buka ADMIN OVERLAY, login dengan user Supabase Auth.
6. Pilih kategori WEDDING/BIRTHDAY/CORPORATE, unggah PNG transparan 1181 x 1772 px, lalu SIMPAN OVERLAY.
7. START > pilih kategori > TAKE PHOTO. Hasil JPG 1181 x 1772 px dengan metadata JFIF 300 DPI (jika browser mengeluarkan JFIF APP0).

PERHATIAN:
- Foto kamera dipotong tengah (center crop) menjadi rasio 2:3; cek komposisi sebelum cetak.
- Overlay PNG harus transparan di area foto; jika PNG tidak transparan, foto tertutup.
- Overlay yang baru disimpan berlaku untuk sesi foto berikutnya, tidak mengubah foto lama.
- Bucket overlays privat, dapat dibaca lewat signed URL; hanya user admin dengan UUID yang ditetapkan yang boleh upload/update menurut SQL policy.
- Jangan menaruh password admin atau Supabase service_role key dalam file website.
- Jika SQL gagal karena aturan storage lama atau user admin belum terverifikasi, periksa Supabase SQL Editor / Authentication.
- Periksa setting printer 10 x 15 cm, borderless/crop, dan kualitas cetak 300 DPI sebelum acara.
