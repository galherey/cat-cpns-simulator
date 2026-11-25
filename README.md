# CAT-CPNS Simulator Web

Aplikasi Web Simulasi Ujian CAT CPNS (SKD) berbasis standar resmi BKN dengan sistem pengacakan bank soal dinamis, perakitan 100 soal pilihan, skoring otomatis, serta **penjelasan dan penyelesaian langkah demi langkah**.

---

## Fitur Utama

1. **Sesuai Standar Ujian SKD CPNS**:
   - **TWK (Tes Wawasan Kebangsaan)**: Benar +5, Salah/Kosong 0. Passing Grade acuan: 65.
   - **TIU (Tes Intelegensia Umum)**: Benar +5, Salah/Kosong 0. Passing Grade acuan: 80.
   - **TKP (Tes Karakteristik Pribadi)**: Bobot skala 1 s/d 5 per opsi. Passing Grade acuan: 156.
2. **Bank Soal Besar & Pengacakan 100 Soal**:
   - Memilih dan mengacak tepat 100 soal per sesi (TWK 27, TIU 32, TKP 41) dengan stratifikasi tingkat kesulitan (mudah, sedang, sulit).
   - Pengacakan urutan soal dan opsi jawaban berbasis *seed*.
   - Tersedia juga mode SKD Resmi 110 Soal dan latihan terfokus per subtes.
3. **Antarmuka Otentik CAT BKN**:
   - Hitung mundur waktu (Countdown Timer) dengan peringatan visual.
   - Panel navigasi nomor soal (Warna Hijau = Dijawab, Kuning = Ragu-ragu, Abu-abu = Belum Dijawab, Biru = Sedang Dibuka).
   - Penyimpanan jawaban otomatis secara real-time.
4. **Pembahasan & Penyelesaian Lengkap**:
   - Rincian skor total dan per subtes vs ambang batas (Passing Grade).
   - Kartu pembahasan untuk setiap nomor soal yang menampilkan kunci jawaban dan **penyelesaian bertahap/langkah demi langkah** (misalnya penguraian deret aritmetika/geometri, rumus kecepatan rata-rata harmonik, perbandingan himpunan, penarikan kesimpulan silogisme, hingga butir pengamalan Pancasila).
   - Filter pembahasan: Tampilkan Semua, Hanya yang Salah / Belum Maksimal, atau per subtes.

---

## Struktur Proyek

```
CPNS/
├── PRD.md              # Dokumen Kebutuhan Produk (PRD) Lengkap
├── package.json        # Konfigurasi proyek Node.js
├── server.js           # HTTP server native Node.js & REST API
├── lib/
│   ├── bank.js         # Question Assembler & filter bank soal
│   ├── exam.js         # Pengelola sesi ujian, skoring & kalkulasi passing grade
│   ├── generators.js   # Generator TIU parametrik (kunci otomatis & solusi langkah demi langkah)
│   ├── modes.js        # Konfigurasi mode ujian & standar SKD BKN
│   └── rng.js          # Generator angka acak deterministik (seeded PRNG)
├── data/
│   ├── twk.js          # Bank soal materi TWK bervalidasi
│   └── tkp.js          # Bank soal materi TKP (skala bobot 1-5 & alasan)
├── public/
│   └── index.html      # Antarmuka SPA Web CAT BKN responsif
└── test/
    └── smoke.js        # Uji otomatis integritas 100 soal, skoring, & server
```

---

## Cara Menjalankan

Aplikasi ini menggunakan modul bawaan murni Node.js (tanpa dependensi eksternal), sehingga dapat langsung dijalankan:

```bash
# Masuk ke folder proyek
cd "c:\Users\user\Documents\Coding\CPNS"

# Jalankan server (default port 3050 agar tidak bentrok dengan proyek lain di port 3000)
node server.js
```

Buka peramban (browser) dan akses:
👉 **http://localhost:3050**

> *Catatan:* Jika Anda ingin menentukan port lain secara manual:
> ```bash
> $env:PORT=8080; node server.js
> ```
