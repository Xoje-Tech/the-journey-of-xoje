#!/usr/bin/env node
// scripts/make-blank-twinny-background.mjs
// One-off helper: writes a 128×512 transparent PNG that
// scripts/generate-twinny-background.js opens as a blank canvas.
// Mirror of scripts/make-blank-lcs-background.mjs.
//
// Run: node scripts/make-blank-twinny-background.mjs

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

const W = 128;
const H = 512;
const OUT = '/home/hermes/projects/the-journey-of-xoje/scripts/blank-twinny-background.png';

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
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const row = Buffer.alloc(1 + W * 4);
const raw = Buffer.alloc(H * row.length);
for (let y = 0; y < H; y++) row.copy(raw, y * row.length);
const idat = deflateSync(raw);

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log(`[OK] wrote ${OUT} (${W}x${H} RGBA transparent PNG, ${png.length} bytes)`);