'use strict';
// Generator soal TIU parametrik. Setiap soal dibuat dari seed, jawabannya dihitung langsung
// (kunci terjamin benar) dan selalu disertai penyelesaian langkah demi langkah.

const { makeRng } = require('./rng');

const fmt = (n) => n.toLocaleString('id-ID');
const rp = (n) => 'Rp' + fmt(n);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const NAMES = ['Budi', 'Sari', 'Andi', 'Dewi', 'Rina', 'Joko', 'Wulan', 'Agus', 'Tono', 'Lina', 'Dimas', 'Nadia'];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const sgn = (x) => (x > 0 ? '+' + x : String(x));

function primeFactors(n) {
  const f = [];
  for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; }
  if (n > 1) f.push(n);
  return f;
}
function factorMap(n) {
  const m = {};
  primeFactors(n).forEach((p) => (m[p] = (m[p] || 0) + 1));
  return m;
}
function factorStr(n) {
  const m = factorMap(n);
  return Object.entries(m).map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join(' × ');
}

// Pilihan jawaban numerik (urut naik, kunci tersisip) -> { options, correct }
function numChoices(r, ans, o = {}) {
  const f = o.fmt || fmt;
  const step = o.step || Math.max(2, Math.round(Math.abs(ans) * 0.1));
  const cand = new Set();
  const deltas = [1, -1, 2, -2, step, -step, 2 * step, -2 * step, 3 * step, -3 * step, 10, -10];
  for (const d of r.shuffle(deltas)) {
    const v = ans + d;
    if (v !== ans && (ans < 0 || v >= 0)) cand.add(v);
    if (cand.size >= 4) break;
  }
  let k = 1;
  while (cand.size < 4) cand.add(ans + step * k++ + 3);
  const all = [ans, ...cand].sort((a, b) => a - b);
  return { options: all.map(f), correct: all.indexOf(ans) };
}

/* ------------------------------------------------------------------ */
/* NUMERIK - DERET                                                     */
/* ------------------------------------------------------------------ */
function deret(r, d) {
  let arr, ans, lines;
  const diffs = (a) => a.slice(1).map((v, i) => v - a[i]);

  if (d === 'mudah') {
    const dec = r.chance(0.3);
    const step = r.int(2, 9);
    const a = dec ? r.int(45, 95) : r.int(1, 30);
    const s = dec ? -step : step;
    arr = [0, 1, 2, 3, 4].map((i) => a + i * s);
    ans = a + 5 * s;
    lines = [
      `Langkah 1 – Hitung selisih antar suku: ${diffs(arr).map(sgn).join(', ')}.`,
      `Langkah 2 – Selisihnya tetap (${sgn(s)}), jadi ini deret aritmetika.`,
      `Langkah 3 – Suku berikutnya = ${arr[4]} ${s > 0 ? '+' : '−'} ${Math.abs(s)} = ${ans}.`,
    ];
  } else if (d === 'sedang') {
    if (r.chance(0.5)) {
      const a = r.int(1, 6);
      const m = r.pick([2, 3]);
      arr = [0, 1, 2, 3, 4].map((i) => a * m ** i);
      ans = a * m ** 5;
      lines = [
        `Langkah 1 – Hitung perbandingan antar suku: ${arr.slice(1).map((v, i) => `${v}÷${arr[i]}`).join(', ')} = ${m}.`,
        `Langkah 2 – Rasio tetap ${m}, jadi ini deret geometri (dikali ${m}).`,
        `Langkah 3 – Suku berikutnya = ${arr[4]} × ${m} = ${ans}.`,
      ];
    } else {
      const a = r.int(1, 20), d1 = r.int(2, 6);
      const b = r.int(15, 40);
      let d2 = r.int(-3, 7); if (d2 === 0) d2 = 4;
      arr = [0, 1, 2, 3, 4, 5, 6].map((i) => (i % 2 === 0 ? a + (i / 2) * d1 : b + ((i - 1) / 2) * d2));
      ans = b + 3 * d2;
      const odd = [arr[0], arr[2], arr[4], arr[6]];
      const even = [arr[1], arr[3], arr[5]];
      lines = [
        'Langkah 1 – Pisahkan deret menjadi dua barisan selang-seling.',
        `Barisan suku ke-1,3,5,7: ${odd.join(', ')} → selisih tetap ${sgn(d1)}.`,
        `Barisan suku ke-2,4,6,(8): ${even.join(', ')}, ? → selisih tetap ${sgn(d2)}.`,
        `Langkah 2 – Suku ke-8 melanjutkan barisan kedua: ${even[2]} ${d2 > 0 ? '+' : '−'} ${Math.abs(d2)} = ${ans}.`,
      ];
    }
  } else {
    const t = r.pick(['bertingkat', 'fib', 'kalitambah']);
    if (t === 'bertingkat') {
      const a = r.int(1, 10), d0 = r.int(1, 4), k = r.int(1, 3);
      arr = [a];
      for (let i = 0; i < 5; i++) arr.push(arr[i] + d0 + i * k);
      const nextDiff = d0 + 5 * k;
      ans = arr[5] + nextDiff;
      lines = [
        `Langkah 1 – Selisih antar suku: ${diffs(arr).map(sgn).join(', ')}.`,
        `Langkah 2 – Selisih itu sendiri bertambah ${k} setiap langkah (beda tingkat dua tetap ${k}).`,
        `Langkah 3 – Selisih berikutnya = ${diffs(arr)[4]} + ${k} = ${nextDiff}.`,
        `Langkah 4 – Suku berikutnya = ${arr[5]} + ${nextDiff} = ${ans}.`,
      ];
    } else if (t === 'fib') {
      const x1 = r.int(1, 5), x2 = r.int(1, 6);
      arr = [x1, x2];
      for (let i = 2; i < 6; i++) arr.push(arr[i - 1] + arr[i - 2]);
      ans = arr[4] + arr[5];
      lines = [
        `Langkah 1 – Perhatikan: ${arr[2]} = ${arr[0]} + ${arr[1]}, ${arr[3]} = ${arr[1]} + ${arr[2]}, ${arr[4]} = ${arr[2]} + ${arr[3]}.`,
        'Langkah 2 – Polanya seperti Fibonacci: setiap suku = jumlah dua suku sebelumnya.',
        `Langkah 3 – Suku berikutnya = ${arr[4]} + ${arr[5]} = ${ans}.`,
      ];
    } else {
      const m = r.pick([2, 3]), c = r.int(-2, 3), a = r.int(2, 5);
      arr = [a];
      for (let i = 0; i < 4; i++) arr.push(m * arr[i] + c);
      ans = m * arr[4] + c;
      lines = [
        `Langkah 1 – Uji pola: ${arr[0]} × ${m} ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = ${arr[1]}; ${arr[1]} × ${m} ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = ${arr[2]}.`,
        `Langkah 2 – Pola konsisten: setiap suku = suku sebelumnya × ${m} ${c >= 0 ? '+' : '−'} ${Math.abs(c)}.`,
        `Langkah 3 – Suku berikutnya = ${arr[4]} × ${m} ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = ${ans}.`,
      ];
    }
  }
  const ch = numChoices(r, ans);
  return {
    body: `Tentukan angka berikutnya dari deret berikut!\n${arr.join(', ')}, ...`,
    options: ch.options,
    correct: ch.correct,
    explanation: lines.join('\n') + `\nJawaban: ${fmt(ans)}.`,
    lockOrder: true,
  };
}

/* ------------------------------------------------------------------ */
/* NUMERIK - ARITMETIKA                                                */
/* ------------------------------------------------------------------ */
const KPK_SETS = [[12, 18], [8, 12], [15, 20], [6, 8, 12], [9, 12, 18], [10, 15, 25], [14, 21], [16, 24], [18, 30], [20, 25, 30]];
const FPB_SETS = [[48, 72], [36, 60], [54, 90], [42, 56], [64, 96], [84, 126], [45, 75, 105], [72, 108], [56, 84]];

function aritmetika(r, d) {
  let body, ans, lines;
  if (d === 'mudah') {
    if (r.chance(0.5)) {
      const a = r.int(3, 25), b = r.int(3, 25), c = r.int(2, 9);
      const e = r.int(1, Math.min(20, (a + b) * c - 1));
      ans = (a + b) * c - e;
      body = `Hasil dari (${a} + ${b}) × ${c} − ${e} adalah ...`;
      lines = [
        `Langkah 1 – Kerjakan tanda kurung lebih dulu: ${a} + ${b} = ${a + b}.`,
        `Langkah 2 – Perkalian: ${a + b} × ${c} = ${(a + b) * c}.`,
        `Langkah 3 – Pengurangan: ${(a + b) * c} − ${e} = ${ans}.`,
      ];
    } else {
      const a = r.int(3, 15), b = r.int(3, 12), c = r.int(3, 15), e = r.int(2, 9);
      ans = a * b + c * e;
      body = `Hasil dari ${a} × ${b} + ${c} × ${e} adalah ...`;
      lines = [
        'Langkah 1 – Perkalian didahulukan sebelum penjumlahan.',
        `Langkah 2 – ${a} × ${b} = ${a * b} dan ${c} × ${e} = ${c * e}.`,
        `Langkah 3 – Jumlahkan: ${a * b} + ${c * e} = ${ans}.`,
      ];
    }
    const ch = numChoices(r, ans);
    return { body, options: ch.options, correct: ch.correct, explanation: lines.join('\n') + `\nJawaban: ${fmt(ans)}.`, lockOrder: true };
  }

  if (d === 'sedang') {
    const t = r.pick(['persen', 'kpk', 'fpb']);
    if (t === 'persen') {
      const p = r.pick([5, 10, 15, 20, 25, 30, 40, 60, 75]);
      const q = r.pick([10, 20, 25, 50, 80]);
      const y = r.int(2, 30) * 20, z = r.int(2, 30) * 20;
      const A = (y / 20) * (p / 5), B = (z / 20) * (q / 5);
      ans = A + B;
      body = `Hasil dari ${p}% × ${y} + ${q}% × ${z} adalah ...`;
      lines = [
        `Langkah 1 – ${p}% × ${y} = (${p}/100) × ${y} = ${A}.`,
        `Langkah 2 – ${q}% × ${z} = (${q}/100) × ${z} = ${B}.`,
        `Langkah 3 – Jumlahkan: ${A} + ${B} = ${ans}.`,
      ];
    } else if (t === 'kpk') {
      const s = r.pick(KPK_SETS);
      ans = s.reduce(lcm);
      body = `KPK dari ${s.join(', ')} adalah ...`;
      lines = [
        'Langkah 1 – Faktorisasi prima tiap bilangan:',
        ...s.map((n) => `   ${n} = ${factorStr(n)}`),
        'Langkah 2 – KPK = hasil kali semua faktor prima dengan PANGKAT TERBESAR.',
        `Langkah 3 – KPK = ${factorStr(ans)} = ${ans}.`,
      ];
    } else {
      const s = r.pick(FPB_SETS);
      ans = s.reduce(gcd);
      body = `FPB dari ${s.join(', ')} adalah ...`;
      lines = [
        'Langkah 1 – Faktorisasi prima tiap bilangan:',
        ...s.map((n) => `   ${n} = ${factorStr(n)}`),
        'Langkah 2 – FPB = hasil kali faktor prima yang SAMA pada semua bilangan dengan PANGKAT TERKECIL.',
        `Langkah 3 – FPB = ${ans === 1 ? '1' : factorStr(ans)} = ${ans}.`,
      ];
    }
    const ch = numChoices(r, ans);
    return { body, options: ch.options, correct: ch.correct, explanation: lines.join('\n') + `\nJawaban: ${fmt(ans)}.`, lockOrder: true };
  }

  // sulit
  if (r.chance(0.5)) {
    const p = r.int(2, 5), s = r.int(6, 15), t = r.int(3, 9);
    ans = p ** 3 - s + t ** 2;
    body = `Hasil dari ${p}³ − √${s * s} + ${t}² adalah ...`;
    lines = [
      `Langkah 1 – Pangkat tiga: ${p}³ = ${p} × ${p} × ${p} = ${p ** 3}.`,
      `Langkah 2 – Akar kuadrat: √${s * s} = ${s} (karena ${s}² = ${s * s}).`,
      `Langkah 3 – Pangkat dua: ${t}² = ${t ** 2}.`,
      `Langkah 4 – ${p ** 3} − ${s} + ${t ** 2} = ${ans}.`,
    ];
  } else {
    const a = r.int(2, 20) * 4, b = r.int(2, 20) * 4, c = r.int(2, 20) * 2;
    ans = a / 4 + (b * 3) / 4 - (c * 3) / 2;
    body = `Hasil dari 0,25 × ${a} + 0,75 × ${b} − 1,5 × ${c} adalah ...`;
    lines = [
      'Langkah 1 – Ubah desimal ke pecahan: 0,25 = 1/4; 0,75 = 3/4; 1,5 = 3/2.',
      `Langkah 2 – (1/4) × ${a} = ${a / 4}; (3/4) × ${b} = ${(b * 3) / 4}; (3/2) × ${c} = ${(c * 3) / 2}.`,
      `Langkah 3 – ${a / 4} + ${(b * 3) / 4} − ${(c * 3) / 2} = ${ans}.`,
    ];
  }
  const ch = numChoices(r, ans);
  return { body, options: ch.options, correct: ch.correct, explanation: lines.join('\n') + `\nJawaban: ${fmt(ans)}.`, lockOrder: true };
}

/* ------------------------------------------------------------------ */
/* NUMERIK - SOAL CERITA                                               */
/* ------------------------------------------------------------------ */
const AVG_PAIRS = [[40, 60], [30, 60], [20, 30], [60, 90], [30, 45], [50, 75], [60, 120], [20, 60], [40, 120]];
const WORK_PAIRS = [[12, 6], [10, 15], [20, 30], [12, 4], [24, 8], [18, 9], [40, 60], [30, 20], [6, 3], [15, 10]];

function cerita(r, d) {
  const n1 = r.pick(NAMES);
  let n2 = r.pick(NAMES); while (n2 === n1) n2 = r.pick(NAMES);
  let body, ans, lines, f = fmt, step;

  const mudah = [
    () => { // diskon
      const y = r.int(5, 40) * 10000, p = r.pick([10, 20, 25, 30, 40, 50]);
      const pot = (y * p) / 100;
      ans = y - pot; f = rp; step = 5000;
      body = `Harga sebuah tas ${rp(y)}. Toko memberi diskon ${p}%. Berapa harga yang harus dibayar ${n1}?`;
      lines = [
        `Langkah 1 – Potongan harga = ${p}% × ${rp(y)} = ${rp(pot)}.`,
        `Langkah 2 – Harga bayar = ${rp(y)} − ${rp(pot)} = ${rp(ans)}.`,
        `(Cara cepat: bayar ${100 - p}% dari harga awal.)`,
      ];
    },
    () => { // kecepatan
      const v = r.int(4, 16) * 5, t = r.int(2, 6);
      ans = v * t; step = 10;
      body = `Sebuah mobil melaju dengan kecepatan rata-rata ${v} km/jam selama ${t} jam. Berapa km jarak yang ditempuh?`;
      lines = [`Langkah 1 – Rumus: jarak = kecepatan × waktu.`, `Langkah 2 – Jarak = ${v} × ${t} = ${ans} km.`];
    },
    () => { // perbandingan
      const a = r.int(1, 5); let b = r.int(2, 7); if (b === a) b += 1;
      const k = r.int(1, 9), unit = r.pick([10000, 25000, 50000]);
      const T = (a + b) * k * unit;
      const askDiff = r.chance(0.5);
      ans = askDiff ? Math.abs(a - b) * k * unit : Math.max(a, b) * k * unit;
      f = rp; step = unit;
      body = `Uang sebesar ${rp(T)} dibagikan kepada ${n1} dan ${n2} dengan perbandingan ${a} : ${b}. ${askDiff ? 'Berapa selisih uang yang mereka terima?' : 'Berapa uang yang diterima oleh orang yang mendapat bagian lebih besar?'}`;
      lines = [
        `Langkah 1 – Jumlah bagian = ${a} + ${b} = ${a + b}.`,
        `Langkah 2 – Nilai satu bagian = ${rp(T)} ÷ ${a + b} = ${rp(k * unit)}.`,
        askDiff
          ? `Langkah 3 – Selisih = |${a} − ${b}| × ${rp(k * unit)} = ${rp(ans)}.`
          : `Langkah 3 – Bagian terbesar = ${Math.max(a, b)} × ${rp(k * unit)} = ${rp(ans)}.`,
      ];
    },
  ];

  const sedang = [
    () => { // usia 1
      const anak = r.int(5, 15), k = r.int(2, 4);
      const S = (k + 1) * anak; ans = k * anak; step = 3;
      body = `Jumlah umur ${n1} dan ayahnya adalah ${S} tahun. Jika umur ayah ${k} kali umur ${n1}, berapa umur ayah?`;
      lines = [
        `Langkah 1 – Misal umur ${n1} = x, maka umur ayah = ${k}x.`,
        `Langkah 2 – x + ${k}x = ${S} → ${k + 1}x = ${S} → x = ${anak}.`,
        `Langkah 3 – Umur ayah = ${k} × ${anak} = ${ans} tahun.`,
      ];
    },
    () => { // rata-rata
      const n = r.int(4, 9), m = r.int(60, 80);
      let x = 50; while ((n * m + x) % (n + 1) !== 0) x++;
      const avg2 = (n * m + x) / (n + 1);
      ans = x; step = 4;
      body = `Rata-rata nilai ${n} siswa adalah ${m}. Setelah seorang siswa baru ikut ujian, rata-rata nilai menjadi ${avg2}. Berapa nilai siswa baru tersebut?`;
      lines = [
        `Langkah 1 – Jumlah nilai awal = ${n} × ${m} = ${n * m}.`,
        `Langkah 2 – Jumlah nilai baru = ${n + 1} × ${avg2} = ${(n + 1) * avg2}.`,
        `Langkah 3 – Nilai siswa baru = ${(n + 1) * avg2} − ${n * m} = ${x}.`,
      ];
    },
    () => { // pekerjaan
      const [x, y] = r.pick(WORK_PAIRS);
      ans = (x * y) / (x + y); step = 2;
      body = `${n1} dapat menyelesaikan suatu pekerjaan dalam ${x} hari, sedangkan ${n2} dalam ${y} hari. Jika keduanya bekerja bersama, pekerjaan selesai dalam ... hari.`;
      lines = [
        `Langkah 1 – Kecepatan ${n1} = 1/${x} pekerjaan per hari; ${n2} = 1/${y}.`,
        `Langkah 2 – Bersama: 1/${x} + 1/${y} = ${y + x}/${x * y} pekerjaan per hari.`,
        `Langkah 3 – Waktu = 1 ÷ (${x + y}/${x * y}) = ${x * y}/${x + y} = ${ans} hari.`,
      ];
    },
    () => { // himpunan
      const k = r.int(3, 10), oa = r.int(3, 15), ob = r.int(3, 15), nn = r.int(2, 8);
      const S = k + oa + ob + nn, A = oa + k, B = ob + k;
      ans = k; step = 2;
      body = `Dari ${S} siswa, ${A} siswa gemar matematika, ${B} siswa gemar fisika, dan ${nn} siswa tidak gemar keduanya. Berapa siswa yang gemar kedua-duanya?`;
      lines = [
        `Langkah 1 – Siswa yang gemar minimal salah satu = ${S} − ${nn} = ${S - nn}.`,
        'Langkah 2 – Rumus: n(M ∪ F) = n(M) + n(F) − n(M ∩ F).',
        `Langkah 3 – ${S - nn} = ${A} + ${B} − n(M ∩ F) → n(M ∩ F) = ${A + B} − ${S - nn} = ${k}.`,
      ];
    },
    () => { // bunga tunggal
      const M = r.int(2, 20) * 500000, p = r.pick([6, 8, 10, 12]), t = r.int(2, 4);
      const bunga = (M * p * t) / 100;
      ans = M + bunga; f = rp; step = 50000;
      body = `${n1} menabung ${rp(M)} dengan bunga tunggal ${p}% per tahun. Berapa total tabungan ${n1} setelah ${t} tahun?`;
      lines = [
        `Langkah 1 – Bunga per tahun = ${p}% × ${rp(M)} = ${rp((M * p) / 100)}.`,
        `Langkah 2 – Bunga ${t} tahun = ${t} × ${rp((M * p) / 100)} = ${rp(bunga)}.`,
        `Langkah 3 – Total = ${rp(M)} + ${rp(bunga)} = ${rp(ans)}.`,
      ];
    },
    () => { // kecepatan berlawanan arah
      const v1 = r.int(6, 16) * 5, v2 = r.int(6, 16) * 5, t = r.int(2, 5);
      const D = (v1 + v2) * t; ans = t; step = 1;
      body = `Dua kota berjarak ${D} km. ${n1} naik motor dari kota A dengan kecepatan ${v1} km/jam dan ${n2} naik mobil dari kota B dengan kecepatan ${v2} km/jam, berangkat bersamaan dan saling berhadapan. Setelah berapa jam mereka bertemu?`;
      lines = [
        'Langkah 1 – Berlawanan arah: kecepatan gabungan = jumlah kecepatan.',
        `Langkah 2 – Kecepatan gabungan = ${v1} + ${v2} = ${v1 + v2} km/jam.`,
        `Langkah 3 – Waktu bertemu = jarak ÷ kecepatan gabungan = ${D} ÷ ${v1 + v2} = ${t} jam.`,
      ];
    },
  ];

  const sulit = [
    () => { // usia 2
      const b = r.int(8, 14), p = r.int(2, 4), q = r.pick([3, 4, 5]);
      const a = q * (b - p) + p, S = a + b;
      ans = b; step = 2;
      body = `${p} tahun yang lalu, umur ayah ${q} kali umur ${n1}. Sekarang jumlah umur mereka ${S} tahun. Berapa umur ${n1} sekarang?`;
      lines = [
        `Langkah 1 – Misal umur ${n1} sekarang = x, maka umur ayah = ${S} − x.`,
        `Langkah 2 – ${p} tahun lalu: (${S} − x − ${p}) = ${q}(x − ${p}).`,
        `Langkah 3 – ${S - p} − x = ${q}x − ${q * p} → ${S - p + q * p} = ${q + 1}x.`,
        `Langkah 4 – x = ${S - p + q * p} ÷ ${q + 1} = ${b}. Umur ayah = ${a}.`,
        `Cek: ${p} tahun lalu ayah ${a - p}, ${n1} ${b - p}; ${a - p} = ${q} × ${b - p} ✓.`,
      ];
    },
    () => { // diskon bertingkat
      const y = r.int(1, 10) * 100000, p1 = r.pick([10, 20, 25, 50]), p2 = r.pick([10, 20, 25, 50]);
      ans = (y * (100 - p1) * (100 - p2)) / 10000; f = rp; step = 10000;
      const a1 = (y * (100 - p1)) / 100;
      body = `Harga sebuah sepatu ${rp(y)}. Toko memberi diskon ${p1}%, kemudian untuk anggota member diberi diskon tambahan ${p2}% dari harga setelah diskon pertama. Berapa harga yang dibayar anggota member?`;
      lines = [
        `Langkah 1 – Setelah diskon ${p1}%: ${rp(y)} × ${100 - p1}% = ${rp(a1)}.`,
        `Langkah 2 – Diskon tambahan dihitung dari ${rp(a1)}: × ${100 - p2}% = ${rp(ans)}.`,
        'Catatan: diskon bertingkat TIDAK dijumlahkan, melainkan dikalikan berurutan.',
      ];
    },
    () => { // rata-rata kecepatan
      const [v1, v2] = r.pick(AVG_PAIRS);
      ans = (2 * v1 * v2) / (v1 + v2); step = 4;
      body = `${n1} mengendarai motor dari kota A ke kota B dengan kecepatan ${v1} km/jam, lalu kembali ke A melalui jalan yang sama dengan kecepatan ${v2} km/jam. Berapa km/jam kecepatan rata-rata perjalanan pulang-pergi?`;
      lines = [
        'Langkah 1 – Misal jarak A–B = s. Waktu pergi = s/' + v1 + ', waktu pulang = s/' + v2 + '.',
        'Langkah 2 – Kecepatan rata-rata = jarak total ÷ waktu total = 2s ÷ (s/' + v1 + ' + s/' + v2 + ').',
        `Langkah 3 – Rumus harmonik: (2 × ${v1} × ${v2}) ÷ (${v1} + ${v2}) = ${2 * v1 * v2} ÷ ${v1 + v2} = ${ans} km/jam.`,
        `Catatan: BUKAN (${v1} + ${v2}) ÷ 2 = ${(v1 + v2) / 2}, karena waktu tempuh kedua perjalanan berbeda.`,
      ];
    },
    () => { // naik lalu turun
      const [p, q] = r.pick([[20, 25], [25, 20], [50, 40], [10, 10], [30, 30]]);
      const y = r.int(1, 10) * 100000;
      ans = (y * (100 + p) * (100 - q)) / 10000; f = rp; step = 10000;
      const mid = (y * (100 + p)) / 100;
      body = `Harga sebuah barang ${rp(y)} dinaikkan ${p}%, kemudian diturunkan ${q}% dari harga yang telah naik tersebut. Berapa harga akhir barang itu?`;
      lines = [
        `Langkah 1 – Setelah naik ${p}%: ${rp(y)} × ${100 + p}% = ${rp(mid)}.`,
        `Langkah 2 – Turun ${q}% dari ${rp(mid)} → ${rp(mid)} × ${100 - q}% = ${rp(ans)}.`,
        'Catatan: kenaikan dan penurunan persen tidak saling menghapus karena basis hitungnya berbeda.',
      ];
    },
  ];

  r.pick({ mudah, sedang, sulit }[d])();
  const ch = numChoices(r, ans, { fmt: f, step });
  return { body, options: ch.options, correct: ch.correct, explanation: lines.join('\n') + `\nJawaban: ${f(ans)}.`, lockOrder: true };
}

/* ------------------------------------------------------------------ */
/* VERBAL - ANALOGI                                                    */
/* ------------------------------------------------------------------ */
const ANALOGI = [
  { rel: 'alat dan fungsinya', diff: 'mudah', pairs: [['Pisau', 'Memotong'], ['Pena', 'Menulis'], ['Sapu', 'Membersihkan lantai'], ['Kompas', 'Menunjukkan arah'], ['Termometer', 'Mengukur suhu'], ['Palu', 'Memukul paku'], ['Jam', 'Menunjukkan waktu']] },
  { rel: 'negara dan ibu kotanya', diff: 'mudah', pairs: [['Indonesia', 'Jakarta'], ['Jepang', 'Tokyo'], ['Thailand', 'Bangkok'], ['Australia', 'Canberra'], ['Prancis', 'Paris'], ['Mesir', 'Kairo'], ['Korea Selatan', 'Seoul']] },
  { rel: 'profesi dan tempat kerjanya', diff: 'mudah', pairs: [['Dokter', 'Rumah sakit'], ['Guru', 'Sekolah'], ['Petani', 'Sawah'], ['Nelayan', 'Laut'], ['Hakim', 'Pengadilan'], ['Pustakawan', 'Perpustakaan'], ['Juru masak', 'Dapur']] },
  { rel: 'hewan dan suaranya', diff: 'mudah', pairs: [['Kucing', 'Mengeong'], ['Anjing', 'Menggonggong'], ['Kuda', 'Meringkik'], ['Singa', 'Mengaum'], ['Ayam jantan', 'Berkokok'], ['Katak', 'Berkoak'], ['Sapi', 'Melenguh']] },
  { rel: 'sebab dan akibat', diff: 'sedang', pairs: [['Hujan lebat', 'Banjir'], ['Belajar tekun', 'Lulus ujian'], ['Kemarau panjang', 'Kekeringan'], ['Kelalaian', 'Kecelakaan'], ['Olahraga teratur', 'Tubuh bugar'], ['Polusi udara', 'Gangguan pernapasan'], ['Kurang tidur', 'Mengantuk']] },
  { rel: 'bagian dan keseluruhannya', diff: 'sedang', pairs: [['Roda', 'Mobil'], ['Halaman', 'Buku'], ['Daun', 'Pohon'], ['Jari', 'Tangan'], ['Layar', 'Laptop'], ['Atap', 'Rumah'], ['Sayap', 'Burung']] },
  { rel: 'produk dan bahan bakunya', diff: 'sedang', pairs: [['Kertas', 'Kayu'], ['Roti', 'Tepung'], ['Kain', 'Kapas'], ['Kaca', 'Pasir'], ['Minyak goreng', 'Kelapa sawit'], ['Tahu', 'Kedelai'], ['Gula', 'Tebu']] },
  { rel: 'ilmu dan objek kajiannya', diff: 'sulit', pairs: [['Biologi', 'Makhluk hidup'], ['Astronomi', 'Benda langit'], ['Sosiologi', 'Masyarakat'], ['Psikologi', 'Perilaku manusia'], ['Arkeologi', 'Peninggalan purbakala'], ['Geografi', 'Permukaan bumi'], ['Ekonomi', 'Produksi dan konsumsi']] },
  { rel: 'pencipta dan karyanya', diff: 'sulit', pairs: [['Penulis', 'Novel'], ['Arsitek', 'Bangunan'], ['Penyair', 'Puisi'], ['Pelukis', 'Lukisan'], ['Komposer', 'Lagu'], ['Pemahat', 'Patung'], ['Programmer', 'Aplikasi']] },
];

function analogi(r, d) {
  let groups = ANALOGI.filter((g) => g.diff === d);
  if (!groups.length) groups = ANALOGI;
  const g = r.pick(groups);
  const [i, j] = r.shuffle(g.pairs.map((_, k) => k)).slice(0, 2);
  const [A, B] = g.pairs[i];
  const [C, D] = g.pairs[j];
  const same = g.pairs.map((p) => p[1]).filter((x) => x !== B && x !== D);
  const other = ANALOGI.filter((x) => x !== g).flatMap((x) => x.pairs.map((p) => p[1]));
  const wrong = new Set();
  for (const x of r.shuffle(same)) { if (wrong.size >= 2) break; wrong.add(x); }
  wrong.add(B);
  for (const x of r.shuffle(other)) { if (wrong.size >= 4) break; if (x !== D) wrong.add(x); }
  const opts = r.shuffle([D, ...wrong]);
  return {
    body: `${A.toUpperCase()} : ${B.toUpperCase()} = ${C.toUpperCase()} : ...`,
    options: opts,
    correct: opts.indexOf(D),
    explanation: [
      `Langkah 1 – Cari hubungan pasangan pertama: ${A} – ${B} → ${g.rel}.`,
      `Langkah 2 – Terapkan hubungan yang sama pada ${C}: pasangan yang tepat adalah ${D}.`,
      `Langkah 3 – Pilihan lain tidak berhubungan dengan ${C} sebagai "${g.rel}" (misalnya "${B}" hanya pasangan dari ${A}).`,
      `Jawaban: ${D}.`,
    ].join('\n'),
    lockOrder: false,
  };
}

/* ------------------------------------------------------------------ */
/* VERBAL - SINONIM & ANTONIM                                          */
/* ------------------------------------------------------------------ */
const SIN = [
  ['Abadi', 'Kekal', 'tidak berkesudahan, tidak berubah selamanya'],
  ['Surya', 'Matahari', 'bintang pusat tata surya'],
  ['Candra', 'Bulan', 'satelit alami bumi'],
  ['Lazim', 'Lumrah', 'biasa, umum terjadi'],
  ['Mufakat', 'Sepakat', 'persetujuan bersama'],
  ['Jenaka', 'Lucu', 'menimbulkan tawa'],
  ['Kuno', 'Purba', 'berasal dari zaman dahulu'],
  ['Rancu', 'Kacau', 'tidak teratur dan tidak jelas'],
  ['Eksklusif', 'Khusus', 'terpisah dari yang lain, hanya untuk golongan tertentu'],
  ['Hakiki', 'Sebenarnya', 'yang sesungguhnya, mendasar'],
  ['Mutakhir', 'Terbaru', 'paling baru'],
  ['Prakarsa', 'Inisiatif', 'gagasan awal yang diwujudkan'],
  ['Siasat', 'Strategi', 'cara atau akal untuk mencapai tujuan'],
  ['Gigih', 'Ulet', 'keras hati, tekun dalam berusaha'],
  ['Imbalan', 'Upah', 'balas jasa atas pekerjaan'],
  ['Hasrat', 'Keinginan', 'kehendak yang kuat'],
  ['Kendala', 'Hambatan', 'halangan dalam mencapai tujuan'],
  ['Mahir', 'Terampil', 'sangat cakap'],
  ['Taat', 'Patuh', 'tunduk pada perintah atau aturan'],
  ['Kikir', 'Pelit', 'sangat hemat sampai tidak mau memberi'],
  ['Gersang', 'Kering', 'tandus, kekurangan air'],
  ['Hipotesis', 'Dugaan sementara', 'jawaban sementara yang masih harus dibuktikan'],
  ['Fakta', 'Kenyataan', 'hal yang benar-benar terjadi'],
  ['Fondasi', 'Dasar', 'bagian terbawah yang menopang'],
];
const ANT = [
  ['Abstrak', 'Konkret', 'abstrak = tidak berwujud; konkret = nyata, dapat dilihat'],
  ['Hulu', 'Hilir', 'hulu = bagian udik sungai; hilir = bagian muara'],
  ['Aktif', 'Pasif', 'aktif = giat bertindak; pasif = tidak bertindak'],
  ['Eksplisit', 'Implisit', 'eksplisit = terus terang; implisit = tersirat'],
  ['Optimis', 'Pesimis', 'optimis = penuh harapan; pesimis = mudah putus asa'],
  ['Mayoritas', 'Minoritas', 'mayoritas = golongan terbanyak; minoritas = golongan sedikit'],
  ['Kuno', 'Modern', 'kuno = zaman dahulu; modern = terbaru/maju'],
  ['Hemat', 'Boros', 'hemat = cermat membelanjakan; boros = berlebihan'],
  ['Rajin', 'Malas', 'rajin = giat bekerja; malas = enggan bekerja'],
  ['Induktif', 'Deduktif', 'induktif = dari khusus ke umum; deduktif = dari umum ke khusus'],
  ['Ekspor', 'Impor', 'ekspor = menjual keluar negeri; impor = memasukkan dari luar negeri'],
  ['Defisit', 'Surplus', 'defisit = kekurangan; surplus = kelebihan'],
  ['Vertikal', 'Horizontal', 'vertikal = tegak lurus; horizontal = mendatar'],
  ['Progresif', 'Konservatif', 'progresif = maju; konservatif = mempertahankan yang lama'],
  ['Kontra', 'Pro', 'kontra = menentang; pro = mendukung'],
  ['Zenit', 'Nadir', 'zenit = titik tertinggi di langit; nadir = titik terendah'],
  ['Transparan', 'Tertutup', 'transparan = terbuka, jelas; tertutup = disembunyikan'],
  ['Sentralisasi', 'Desentralisasi', 'sentralisasi = pemusatan; desentralisasi = penyebaran kewenangan'],
];

function sinAnt(r) {
  const isSin = r.chance(0.5);
  const list = isSin ? SIN : ANT;
  const [w, ans, mean] = r.pick(list);
  const pool = list.filter((x) => x[0] !== w).map((x) => x[1]).filter((x) => x !== ans);
  const wrong = r.shuffle(pool).slice(0, 4);
  const opts = r.shuffle([ans, ...wrong]);
  return {
    body: `${isSin ? 'Sinonim' : 'Antonim'} (${isSin ? 'persamaan kata' : 'lawan kata'}) dari kata "${w}" adalah ...`,
    options: opts,
    correct: opts.indexOf(ans),
    explanation: [
      `Langkah 1 – Pahami makna kata "${w}": ${isSin ? mean : mean.split(';')[0].replace(/^.*? = /, '')}.`,
      isSin
        ? `Langkah 2 – Cari kata yang bermakna sama: "${ans}".`
        : `Langkah 2 – Cari kata yang maknanya berlawanan: "${ans}" (${mean.split('; ')[1].replace(/^.*? = /, '')}).`,
      'Langkah 3 – Pilihan lain tidak memiliki hubungan makna tersebut.',
      `Jawaban: ${ans}.`,
    ].join('\n'),
    lockOrder: false,
  };
}

/* ------------------------------------------------------------------ */
/* VERBAL - SILOGISME                                                  */
/* ------------------------------------------------------------------ */
const BARBARA = [
  ['kucing', 'mamalia', 'hewan berdarah panas'],
  ['guru', 'pendidik', 'pekerja profesional'],
  ['apel', 'buah', 'makanan sehat'],
  ['pegawai negeri sipil', 'abdi negara', 'pelayan masyarakat'],
  ['mahasiswa', 'pelajar', 'orang yang menuntut ilmu'],
  ['atlet renang', 'olahragawan', 'orang yang menjaga kebugaran'],
  ['dokter', 'tenaga kesehatan', 'pekerja yang melayani masyarakat'],
  ['mangga', 'tumbuhan berbuah', 'makhluk hidup'],
];
const NEG = [
  ['reptil', 'mamalia', 'ular'],
  ['bilangan ganjil', 'bilangan genap', 'bilangan prima lebih dari 2'],
  ['ikan', 'burung', 'ikan hiu'],
  ['logam', 'kayu', 'besi'],
  ['serangga', 'mamalia', 'semut'],
  ['tumbuhan', 'hewan', 'pohon jati'],
];
const COND = [
  ['hujan deras turun', 'jalanan menjadi basah'],
  ['lampu lalu lintas menyala merah', 'kendaraan harus berhenti'],
  ['Rani lulus ujian', 'Rani mendapatkan sertifikat'],
  ['harga BBM naik', 'harga barang kebutuhan naik'],
  ['pegawai terlambat tanpa alasan', 'pegawai mendapat teguran'],
  ['listrik padam', 'komputer kantor mati'],
  ['air dipanaskan hingga 100°C', 'air mendidih'],
  ['siswa belajar dengan tekun', 'siswa lulus ujian'],
];

function silogisme(r, d) {
  const kinds = { mudah: ['barbara', 'ponens'], sedang: ['tollens', 'neg'], sulit: ['neg', 'afirmasi', 'denial'] }[d];
  const kind = r.pick(kinds);
  const NOCON = 'Tidak ada kesimpulan yang dapat ditarik.';

  if (kind === 'barbara' || kind === 'neg') {
    let body, opts, ans, why;
    if (kind === 'barbara') {
      const [A, B, C] = r.pick(BARBARA);
      body = `Premis 1: Semua ${A} adalah ${B}.\nPremis 2: Semua ${B} adalah ${C}.\nKesimpulan yang PASTI benar adalah ...`;
      ans = `Semua ${A} adalah ${C}.`;
      opts = [ans, `Semua ${C} adalah ${A}.`, `Semua ${B} adalah ${A}.`, `Tidak ada ${A} yang merupakan ${C}.`, NOCON];
      why = [
        `Langkah 1 – Gambarkan himpunan: ${A} ⊂ ${B} ⊂ ${C} (lingkaran ${A} berada di dalam ${B}, ${B} di dalam ${C}).`,
        `Langkah 2 – Karena ${A} berada di dalam ${B} dan ${B} di dalam ${C}, maka ${A} pasti berada di dalam ${C}.`,
        `Langkah 3 – Kebalikannya ("Semua ${C} adalah ${A}") tidak pasti benar, karena lingkaran ${C} lebih besar.`,
      ];
    } else {
      const [X, Y, Z] = r.pick(NEG);
      body = `Premis 1: Tidak ada ${X} yang merupakan ${Y}.\nPremis 2: Semua ${Z} adalah ${X}.\nKesimpulan yang PASTI benar adalah ...`;
      ans = `Tidak ada ${Z} yang merupakan ${Y}.`;
      opts = [ans, `Semua ${Z} adalah ${Y}.`, `Sebagian ${Z} adalah ${Y}.`, `Semua ${Y} adalah ${Z}.`, NOCON];
      why = [
        `Langkah 1 – Gambarkan himpunan: ${X} dan ${Y} saling lepas (tidak beririsan).`,
        `Langkah 2 – ${Z} berada di dalam ${X}, sehingga ikut terpisah dari ${Y}.`,
        `Langkah 3 – Maka tidak ada ${Z} yang termasuk ${Y}.`,
      ];
    }
    const o = r.shuffle(opts);
    return { body, options: o, correct: o.indexOf(ans), explanation: why.join('\n') + `\nJawaban: ${ans}`, lockOrder: false };
  }

  // silogisme kondisional
  const [P, Q] = r.pick(COND);
  const notP = `Tidak benar bahwa ${P}.`;
  const notQ = `Tidak benar bahwa ${Q}.`;
  let p2, ans, why;
  if (kind === 'ponens') {
    p2 = `${cap(P)}.`;
    ans = `${cap(Q)}.`;
    why = [
      'Langkah 1 – Bentuk premis: P → Q (jika P maka Q), dan P benar.',
      'Langkah 2 – Aturan Modus Ponens: P benar dan P → Q, maka Q pasti benar.',
      `Langkah 3 – Q di sini adalah: "${Q}".`,
    ];
  } else if (kind === 'tollens') {
    p2 = notQ;
    ans = notP;
    why = [
      'Langkah 1 – Bentuk premis: P → Q, dan Q tidak benar (¬Q).',
      'Langkah 2 – Aturan Modus Tollens: P → Q dan ¬Q, maka ¬P (kontraposisi).',
      `Langkah 3 – Jika P benar maka Q pasti terjadi; karena Q tidak terjadi, P pasti tidak benar: "${P}" tidak benar.`,
    ];
  } else if (kind === 'afirmasi') {
    p2 = `${cap(Q)}.`;
    ans = NOCON.replace('ditarik', 'ditarik secara pasti');
    why = [
      'Langkah 1 – Bentuk premis: P → Q, dan Q benar.',
      'Langkah 2 – Menyimpulkan P dari Q adalah kesesatan "menegaskan konsekuen". Q bisa saja terjadi karena sebab lain.',
      `Langkah 3 – Jadi "${P}" belum tentu benar. Tidak ada kesimpulan yang pasti.`,
    ];
  } else {
    p2 = notP;
    ans = NOCON.replace('ditarik', 'ditarik secara pasti');
    why = [
      'Langkah 1 – Bentuk premis: P → Q, dan P tidak benar (¬P).',
      'Langkah 2 – Menyimpulkan ¬Q dari ¬P adalah kesesatan "menyangkal anteseden".',
      `Langkah 3 – Q ("${Q}") masih mungkin terjadi karena sebab lain, sehingga tidak ada kesimpulan pasti.`,
    ];
  }
  const nocon = NOCON.replace('ditarik', 'ditarik secara pasti');
  const base = [`${cap(Q)}.`, notQ, notP, `${cap(P)}, tetapi ${Q} tidak terjadi.`, nocon];
  const o = r.shuffle(base);
  return {
    body: `Premis 1: Jika ${P}, maka ${Q}.\nPremis 2: ${p2}\nKesimpulan yang PASTI benar adalah ...`,
    options: o,
    correct: o.indexOf(ans),
    explanation: why.join('\n') + `\nJawaban: ${ans}`,
    lockOrder: false,
  };
}

/* ------------------------------------------------------------------ */
/* REGISTRY                                                            */
/* ------------------------------------------------------------------ */
const TIU_CATEGORIES = [
  { name: 'Verbal - Analogi', weight: 5, fn: analogi },
  { name: 'Verbal - Sinonim & Antonim', weight: 4, fn: sinAnt },
  { name: 'Verbal - Silogisme', weight: 4, fn: silogisme },
  { name: 'Numerik - Deret', weight: 6, fn: deret },
  { name: 'Numerik - Aritmetika', weight: 6, fn: aritmetika },
  { name: 'Numerik - Soal Cerita', weight: 7, fn: cerita },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '');

function generate(category, difficulty, seed) {
  const cat = TIU_CATEGORIES.find((c) => c.name === category);
  if (!cat) throw new Error('Kategori generator tidak dikenal: ' + category);
  const r = makeRng(seed);
  const q = cat.fn(r, difficulty);
  return {
    id: `g:${slug(category)}:${difficulty[0]}:${seed}`,
    subtest: 'TIU',
    category,
    difficulty,
    body: q.body,
    options: q.options.map((text, i) => ({ text, correct: i === q.correct })),
    explanation: q.explanation,
    lockOrder: !!q.lockOrder,
    generated: true,
  };
}

module.exports = { TIU_CATEGORIES, generate };
