#!/usr/bin/env node
// scripts/make-blank-template.mjs
// One-off helper: writes a transparent 1920x1080 PNG to /tmp using only Node stdlib (zlib).
// Reason: PIL is not installed and we cannot sudo-install. The PNG spec for a fully
// transparent RGBA image is small and self-contained, so we hand-build it.
//
// Run: node scripts/make-blank-template.mjs [width height outPath]

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

const W = Number(process.argv[2] ?? 1920);
const H = Number(process.argv[3] ?? 1080);
const OUT = process.argv[4] ?? '/tmp/blank1920x1080.png';

// --- CRC32 (PNG uses standard CRC-32/ISO-HDLC) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// --- PNG chunk writer ---
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// --- IHDR: width, height, bit depth 8, color type 6 (RGBA), compression 0, filter 0, interlace 0 ---
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr.writeUInt8(8, 8);   // bit depth
ihdr.writeUInt8(6, 9);   // color type: 6 = RGBA
ihdr.writeUInt8(0, 10);  // compression
ihdr.writeUInt8(0, 11);  // filter
ihdr.writeUInt8(0, 12);  // interlace

// --- IDAT: filter byte 0 per scanline, RGBA = 4 bytes per pixel ---
const rowLen = 1 + W * 4;
const raw = Buffer.alloc(rowLen * H);
for (let y = 0; y < H; y++) {
  raw[y * rowLen] = 0; // filter: None
  // remaining bytes already 0 -> transparent black RGBA(0,0,0,0)
}
const idat = deflateSync(raw, { level: 9 });

// --- Assemble ---
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`Wrote ${OUT} (${png.length} bytes, ${W}x${H} RGBA transparent)`);
