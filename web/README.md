# FaceAttend

FaceAttend adalah aplikasi absensi karyawan berbasis web untuk Creativemu. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, monitoring absensi, serta pelaporan kehadiran karyawan.

Pada versi terbaru, sistem tidak lagi menggunakan face recognition berbasis AI. Mekanisme absensi dilakukan dengan cara karyawan mengambil foto melalui kamera browser sebagai bukti kehadiran, lalu sistem juga menyimpan lokasi GPS saat check-in dan check-out.

## Status Project

**Status:** Development

Saat ini project sudah berada pada tahap pengembangan frontend, routing admin/karyawan, navigasi, integrasi database MySQL lokal, Prisma ORM, custom authentication, employee management, photo attendance, GPS attendance, dan pengembangan awal fitur laporan kehadiran.

Fitur utama yang sudah mulai dikembangkan:

* Login admin dan karyawan
* Custom authentication menggunakan JWT dan cookie
* Database MySQL lokal untuk development
* Prisma ORM dan Prisma Migration
* Seed akun admin
* Employee management
* Attendance check-in dengan foto
* Attendance check-out dengan foto
* Penyimpanan lokasi GPS saat check-in dan check-out
* Riwayat absensi karyawan
* Filter riwayat berdasarkan bulan dan tahun
* Perencanaan laporan keterlambatan, tepat waktu, dan tidak hadir
* Perencanaan master data shift, jam kerja, divisi, dan jabatan
* Perencanaan database cloud untuk production

## Tech Stack

### Web

* Next.js
* TypeScript
* Tailwind CSS
* App Router
* Lucide React

### Database & ORM

* MySQL untuk database lokal saat development
* Prisma ORM untuk mengelola schema dan query database
* Prisma Migration untuk versioning perubahan struktur database
* Prisma Client untuk akses database dari aplikasi Next.js
* Sequel Ace untuk melihat dan mengelola database MySQL lokal
* Prisma Studio untuk melihat data database melalui browser

> Catatan: Prisma MariaDB Adapter hanya perlu dicantumkan jika project benar-benar menggunakannya di konfigurasi Prisma. Jika project hanya memakai provider `mysql` biasa dari Prisma, adapter tersebut tidak wajib dicantumkan.

### Authentication

* Custom Authentication
* bcryptjs untuk hash password
* jose untuk JWT
* Cookie-based session menggunakan `faceattend_token`

### Attendance System

* Kamera browser untuk mengambil foto absensi
* GPS browser untuk mengambil lokasi karyawan
* Check-in berbasis foto dan lokasi
* Check-out berbasis foto dan lokasi
* Review foto sebelum dikirim ke database
* Ambil ulang foto sebelum submit absensi
* Riwayat kehadiran berdasarkan bulan dan tahun

## Konsep Absensi

FaceAttend menggunakan sistem absensi berbasis foto dan lokasi.

Alur check-in:

```txt
Karyawan membuka halaman Attendance
→ Kamera aktif
→ Karyawan klik Ambil Foto Check-in
→ Sistem mengambil foto dan lokasi GPS
→ Karyawan bisa review foto
→ Jika foto tidak sesuai, karyawan bisa Ambil Ulang
→ Jika sudah sesuai, karyawan klik Kirim Absensi
→ Data check-in masuk ke database
```

Alur check-out:

```txt
Karyawan membuka halaman Attendance
→ Sistem mengecek apakah karyawan sudah check-in hari ini
→ Kamera aktif
→ Karyawan klik Ambil Foto Check-out
→ Sistem mengambil foto dan lokasi GPS
→ Karyawan bisa review foto
→ Jika foto tidak sesuai, karyawan bisa Ambil Ulang
→ Jika sudah sesuai, karyawan klik Kirim Check-out
→ Data check-out masuk ke database
```

Data absensi yang disimpan:

* ID karyawan
* Tanggal absensi
* Jam check-in
* Jam check-out
* Foto check-in
* Foto check-out
* Latitude check-in
* Longitude check-in
* Latitude check-out
* Longitude check-out
* Status kehadiran
* Catatan atau informasi tambahan jika diperlukan

## Role Pengguna

### Admin

Admin memiliki akses untuk:

* Login ke dashboard admin
* Melihat ringkasan absensi
* Mengelola data karyawan
* Menambahkan karyawan baru
* Mengedit data karyawan
* Menghapus data karyawan
* Melihat riwayat absensi karyawan
* Melakukan monitoring kehadiran
* Melihat laporan kehadiran
* Mengelola master data seperti shift, divisi, jabatan, dan jam kerja pada tahap pengembangan berikutnya

### Karyawan

Karyawan memiliki akses untuk:

* Login ke aplikasi
* Melakukan check-in
* Melakukan check-out
* Mengambil foto absensi melalui kamera browser
* Mengirim lokasi GPS saat absensi
* Melihat riwayat absensi pribadi
* Melihat status kehadiran pribadi

## Project Structure

```txt
face-attend/
├── web/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed-admin.ts
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── employees/
│   │   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── api/
│   │   │   │   ├── attendance/
│   │   │   │   ├── auth/
│   │   │   │   └── users/
│   │   │   ├── attendance/
│   │   │   ├── history/
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── profile/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   └── lib/
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Authentication

FaceAttend menggunakan custom authentication.

Proses login:

```txt
User memasukkan email dan password
→ Server mencari user berdasarkan email
→ Password dibandingkan menggunakan bcryptjs
→ Jika valid, server membuat JWT menggunakan jose
→ Token disimpan ke cookie dengan nama faceattend_token
→ User diarahkan ke halaman sesuai role
```

Cookie yang digunakan:

```txt
faceattend_token
```

Role yang digunakan:

```txt
ADMIN
EMPLOYEE
```

## Database

FaceAttend menggunakan database MySQL.

Pada tahap development, database dijalankan secara lokal di laptop developer. Untuk tahap production, database sebaiknya dipindahkan ke database cloud agar aplikasi dapat diakses oleh karyawan dari perangkat masing-masing.

Database digunakan untuk menyimpan:

* Data akun admin dan karyawan
* Data profil karyawan
* Data absensi harian
* Jam check-in dan check-out
* Lokasi GPS check-in dan check-out
* Path atau URL foto absensi
* Status kehadiran
* Data laporan kehadiran
* Data master seperti shift, divisi, jabatan, dan jam kerja jika fitur tersebut sudah dikembangkan

Database dikelola menggunakan:

* Prisma ORM
* Prisma Migration
* Prisma Client
* MySQL lokal untuk development
* Database cloud untuk production
* Sequel Ace untuk GUI database lokal
* Prisma Studio untuk melihat data database

Contoh konfigurasi environment untuk development lokal:

```env
DATABASE_URL="mysql://root:password@localhost:3306/face_attend"
JWT_SECRET="your-secret-key"
```

Contoh konfigurasi environment untuk production:

```env
DATABASE_URL="mysql://username:password@host-database:3306/face_attend"
JWT_SECRET="production-secret-key"
```

> Sesuaikan `username`, `password`, `host`, `port`, dan `database name` dengan konfigurasi database yang digunakan.

> Jangan commit file `.env` ke GitHub karena berisi credential database dan secret aplikasi.

## Database Development Flow

Alur kerja database saat development:

```txt
Ubah schema di prisma/schema.prisma
→ Jalankan migration
→ Prisma membuat file migration
→ Prisma Client di-generate
→ Aplikasi menggunakan Prisma Client untuk query database
```

Perintah yang digunakan:

```bash
npx prisma migrate dev
```

```bash
npx prisma generate
```

Untuk melihat isi database melalui browser:

```bash
npx prisma studio
```

Untuk menjalankan seed akun admin:

```bash
npx prisma db seed
```

Jika database lokal ingin di-reset saat development:

```bash
npx prisma migrate reset
```

> Perintah `migrate reset` akan menghapus data di database lokal, lalu menjalankan migration dan seed ulang. Gunakan hanya untuk development.

## Catatan Penyimpanan Foto Absensi

Pada tahap awal development, foto absensi dapat disimpan sebagai data sementara atau path file.

Untuk production, foto absensi sebaiknya tidak disimpan langsung sebagai base64 besar di database karena dapat membuat database cepat membesar dan query menjadi berat.

Rekomendasi production:

```txt
Foto absensi disimpan di cloud storage
Database hanya menyimpan URL atau path foto
```

Contoh data yang disimpan di database:

```txt
checkInPhotoUrl
checkOutPhotoUrl
```

Contoh storage yang bisa digunakan pada tahap production:

* UploadThing
* Cloudinary
* Supabase Storage
* AWS S3
* Google Cloud Storage

## Setup Project

Masuk ke folder web:

```bash
cd web
```

Install dependencies:

```bash
npm install
```

Buat file `.env`:

```bash
touch .env
```

Isi file `.env` untuk development lokal:

```env
DATABASE_URL="mysql://root:password@localhost:3306/face_attend"
JWT_SECRET="your-secret-key"
```

Pastikan database MySQL sudah dibuat terlebih dahulu.

Contoh membuat database melalui MySQL:

```sql
CREATE DATABASE face_attend;
```

Jalankan Prisma Migration:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Seed akun admin:

```bash
npx prisma db seed
```

Jalankan development server:

```bash
npm run dev
```

Buka aplikasi di browser:

```txt
http://localhost:3000
```

## Prisma Studio

Untuk melihat data database melalui Prisma Studio:

```bash
npx prisma studio
```

Prisma Studio biasanya berjalan di:

```txt
http://localhost:5555
```

## Akun Admin Default

Akun admin dibuat melalui proses seed.

Contoh akun admin development:

```txt
Email    : admin@creativemu.com
Password : admin123456
Role     : ADMIN
```

> Akun ini digunakan untuk kebutuhan development lokal dan sebaiknya diganti pada environment production.

## Fitur yang Sudah Dikembangkan

### Authentication

* Login admin
* Login karyawan
* JWT authentication
* Cookie-based session
* Hash password menggunakan bcryptjs
* Pengecekan session user
* Logout

### Admin

* Dashboard admin
* Employee management
* Tambah data karyawan
* Edit karyawan
* Hapus karyawan
* Melihat daftar karyawan
* Navigasi admin
* Tampilan mobile responsive

### Karyawan

* Halaman home karyawan
* Halaman attendance
* Halaman history
* Halaman profile
* Navigasi karyawan
* Tampilan mobile responsive

### Attendance

* Kamera browser untuk absensi
* Ambil foto check-in
* Ambil foto check-out
* Review foto sebelum submit
* Ambil ulang foto
* Pengambilan lokasi GPS
* Penyimpanan latitude dan longitude
* Riwayat absensi berdasarkan bulan dan tahun

## Fitur yang Direncanakan

Fitur yang akan dikembangkan berikutnya:

* Dashboard monitoring absensi
* Laporan keterlambatan
* Laporan tepat waktu
* Laporan tidak hadir
* Export laporan ke Excel atau PDF
* Master data shift
* Master data jam kerja
* Master data divisi
* Master data jabatan
* Validasi radius lokasi kantor
* Validasi jam masuk dan jam pulang
* Status otomatis hadir, terlambat, izin, sakit, atau tidak hadir
* Upload atau penyimpanan foto absensi ke cloud storage
* Deployment frontend
* Deployment database cloud
* Penyesuaian environment production

## Catatan Perubahan Konsep

Pada konsep awal, FaceAttend direncanakan menggunakan face recognition berbasis AI.

Namun pada versi terbaru, konsep tersebut diganti menjadi sistem absensi berbasis:

* Foto dari kamera browser
* Lokasi GPS dari browser
* Bukti kehadiran visual
* Riwayat absensi digital

Dengan perubahan ini, sistem menjadi lebih sederhana, lebih ringan, lebih mudah dikembangkan, dan lebih cocok untuk tahap awal implementasi aplikasi absensi berbasis web.

## Development Notes

Beberapa catatan teknis pengembangan:

* Aplikasi menggunakan Next.js App Router.
* API dibuat menggunakan route handler bawaan Next.js.
* Database menggunakan MySQL lokal untuk tahap development.
* Database cloud akan digunakan ketika aplikasi masuk tahap production.
* Prisma digunakan untuk schema, migration, dan query database.
* Authentication dibuat secara custom tanpa NextAuth.
* Token login disimpan menggunakan cookie.
* Foto absensi diambil melalui kamera browser.
* Lokasi absensi diambil menggunakan Geolocation API browser.
* Sistem absensi masih dalam tahap pengembangan dan akan terus disempurnakan.

## Security Notes

Beberapa hal yang perlu diperhatikan sebelum production:

* Ganti `JWT_SECRET` dengan secret yang kuat.
* Jangan commit file `.env`.
* Gunakan HTTPS agar kamera dan GPS browser dapat berjalan optimal.
* Gunakan database cloud yang aman untuk production.
* Batasi akses database hanya dari aplikasi atau environment yang dipercaya.
* Jangan menampilkan credential database di frontend.
* Validasi role user pada setiap API.
* Validasi input dari client.
* Batasi ukuran foto yang dikirim ke server.
* Gunakan cloud storage jika foto absensi semakin banyak.
* Simpan URL foto di database, bukan file besar langsung di database.
* Terapkan validasi lokasi kantor jika absensi hanya boleh dilakukan di area tertentu.
* Siapkan backup database secara berkala untuk mencegah kehilangan data.

## Roadmap

### Phase 1 — Core App

* Setup Next.js
* Setup Tailwind CSS
* Setup routing
* Setup layout mobile
* Setup login page
* Setup dashboard admin
* Setup halaman karyawan

### Phase 2 — Database & Authentication

* Setup MySQL lokal
* Setup Prisma ORM
* Setup migration
* Setup seed admin
* Setup custom login
* Setup JWT dan cookie session
* Setup role admin dan employee
* Setup database cloud saat production

### Phase 3 — Employee Management

* Tambah karyawan
* Edit karyawan
* Hapus karyawan
* List karyawan
* Detail karyawan

### Phase 4 — Attendance System

* Kamera browser
* Ambil foto check-in
* Ambil foto check-out
* Review foto
* Ambil ulang foto
* Simpan data absensi
* Simpan lokasi GPS
* Riwayat absensi

### Phase 5 — Reports & Monitoring

* Laporan kehadiran
* Laporan keterlambatan
* Laporan tidak hadir
* Filter laporan
* Export laporan
* Dashboard monitoring admin

### Phase 6 — Production Preparation

* Deployment aplikasi
* Setup database cloud
* Setup environment production
* Setup penyimpanan foto ke cloud storage
* Validasi keamanan
* Optimasi performa
* Pengujian aplikasi
* Backup database production

## Author

Developed by Muhammad Ardian Maulana And Dylan for Creativemu.

## License

This project is currently used for development and internal project purposes.
