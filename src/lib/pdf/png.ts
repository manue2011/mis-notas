import "server-only";
import { deflateSync } from "node:zlib";

// A minimal PNG encoder for the raw pixels pdf.js hands back, so images
// inside a PDF can be uploaded without an image library. Cloudinary turns
// them into WebP afterwards.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

export type RawImage = {
  width: number;
  height: number;
  /** 1 = grey, 3 = RGB, 4 = RGBA; one byte per channel. */
  channels: 1 | 3 | 4;
  data: Uint8Array | Uint8ClampedArray;
};

const COLOR_TYPE = { 1: 0, 3: 2, 4: 6 } as const;

export function encodePng({ width, height, channels, data }: RawImage): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits per channel
  header[9] = COLOR_TYPE[channels];

  // Each row starts with its filter byte (0: none).
  const stride = width * channels;
  const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rows.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", new Uint8Array()),
  ]);
}

/** Halves the image (averaging 2×2 squares) until its longest side fits. */
export function shrinkToFit(image: RawImage, maxSide: number): RawImage {
  let current = image;
  while (Math.max(current.width, current.height) > maxSide) {
    const { width, height, channels, data } = current;
    const w = Math.floor(width / 2);
    const h = Math.floor(height / 2);
    const out = new Uint8Array(w * h * channels);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < channels; c++) {
          const at = (yy: number, xx: number) => data[(yy * width + xx) * channels + c];
          out[(y * w + x) * channels + c] =
            (at(2 * y, 2 * x) + at(2 * y, 2 * x + 1) + at(2 * y + 1, 2 * x) + at(2 * y + 1, 2 * x + 1)) >> 2;
        }
      }
    }
    current = { width: w, height: h, channels, data: out };
  }
  return current;
}
