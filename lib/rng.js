'use strict';
// RNG deterministik (seeded) supaya sesi ujian bisa direproduksi untuk audit.

function hashSeed(s) {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed) {
  const f = mulberry32(typeof seed === 'number' ? seed : hashSeed(seed));
  const r = () => f();
  r.int = (a, b) => a + Math.floor(f() * (b - a + 1));
  r.pick = (arr) => arr[Math.floor(f() * arr.length)];
  r.chance = (p) => f() < p;
  r.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(f() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return r;
}

module.exports = { makeRng, hashSeed };
