import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "..");
const OUTPUTS = [
  { name: "icon-192.png", size: 192, markScale: 0.88 },
  { name: "icon-512.png", size: 512, markScale: 0.88 },
  { name: "icon-maskable-512.png", size: 512, markScale: 0.76 },
];

const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (width * 4 + 1);
    scanlines[target] = 0;
    rgba.copy(scanlines, target + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(from, to, amount) {
  return from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * amount),
  );
}

function blendPixel(pixels, size, x, y, color, alpha = 1) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || px >= size || py < 0 || py >= size || alpha <= 0) return;
  const offset = (py * size + px) * 4;
  const inverse = 1 - alpha;
  pixels[offset] = Math.round(color[0] * alpha + pixels[offset] * inverse);
  pixels[offset + 1] = Math.round(
    color[1] * alpha + pixels[offset + 1] * inverse,
  );
  pixels[offset + 2] = Math.round(
    color[2] * alpha + pixels[offset + 2] * inverse,
  );
  pixels[offset + 3] = 255;
}

function circle(pixels, size, cx, cy, radius, color, alpha = 1) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(size - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(size - 1, Math.ceil(cy + radius));
  const feather = Math.max(1, size / 512);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance <= radius + feather) {
        const edge = Math.min(1, radius + feather - distance);
        blendPixel(pixels, size, x, y, color, alpha * edge);
      }
    }
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let current = 0, previous = points.length - 1; current < points.length; previous = current, current += 1) {
    const [x1, y1] = points[current];
    const [x2, y2] = points[previous];
    const crosses =
      y1 > y !== y2 > y &&
      x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
    if (crosses) inside = !inside;
  }
  return inside;
}

function polygon(pixels, size, points, color, alpha = 1) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(size - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(size - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (pointInPolygon(x + 0.5, y + 0.5, points)) {
        blendPixel(pixels, size, x, y, color, alpha);
      }
    }
  }
}

function line(pixels, size, from, to, width, color, alpha = 1) {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(1, Math.ceil(distance * 1.3));
  for (let index = 0; index <= steps; index += 1) {
    const amount = index / steps;
    circle(
      pixels,
      size,
      from[0] + (to[0] - from[0]) * amount,
      from[1] + (to[1] - from[1]) * amount,
      width / 2,
      color,
      alpha,
    );
  }
}

function outline(pixels, size, points, width, color, alpha = 1) {
  points.forEach((point, index) => {
    line(
      pixels,
      size,
      point,
      points[(index + 1) % points.length],
      width,
      color,
      alpha,
    );
  });
}

function cubicPoint(from, controlA, controlB, to, amount) {
  const inverse = 1 - amount;
  return [
    inverse ** 3 * from[0] +
      3 * inverse ** 2 * amount * controlA[0] +
      3 * inverse * amount ** 2 * controlB[0] +
      amount ** 3 * to[0],
    inverse ** 3 * from[1] +
      3 * inverse ** 2 * amount * controlA[1] +
      3 * inverse * amount ** 2 * controlB[1] +
      amount ** 3 * to[1],
  ];
}

function cubic(pixels, size, points, width, color, alpha = 1) {
  let previous = points[0];
  for (let index = 1; index <= 72; index += 1) {
    const current = cubicPoint(...points, index / 72);
    line(pixels, size, previous, current, width, color, alpha);
    previous = current;
  }
}

function renderIcon(size, markScale) {
  const pixels = Buffer.alloc(size * size * 4);
  const unit = size / 512;
  const transform = ([x, y]) => [
    size / 2 + (x - 256) * unit * markScale,
    size / 2 + (y - 256) * unit * markScale,
  ];
  const scale = unit * markScale;

  const nightTop = [37, 55, 93];
  const nightBottom = [8, 13, 27];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const linear = (x + y) / (2 * Math.max(1, size - 1));
      const glowDistance = Math.hypot(
        x / size - 0.5,
        y / size - 0.44,
      );
      const glow = Math.max(0, 1 - glowDistance / 0.48) * 0.12;
      const base = mix(nightTop, nightBottom, linear);
      const color = mix(base, [242, 189, 106], glow);
      const offset = (y * size + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  [
    [148, 116, 4, 0.72],
    [354, 111, 3, 0.58],
    [394, 181, 4, 0.48],
    [111, 211, 3, 0.48],
  ].forEach(([x, y, radius, alpha]) => {
    const [cx, cy] = transform([x, y]);
    circle(pixels, size, cx, cy, radius * scale, [248, 217, 149], alpha);
  });

  const leftPage = [
    [137, 175],
    [183, 161],
    [222, 170],
    [256, 190],
    [256, 355],
    [218, 333],
    [177, 329],
    [137, 338],
  ].map(transform);
  const rightPage = leftPage.map(([x, y]) => [size - x, y]);
  const paper = [232, 240, 237];
  const gold = [239, 195, 113];

  polygon(pixels, size, leftPage, paper);
  polygon(pixels, size, rightPage, paper);
  outline(pixels, size, leftPage, 7 * scale, gold);
  outline(pixels, size, rightPage, 7 * scale, gold);

  line(
    pixels,
    size,
    transform([256, 190]),
    transform([256, 355]),
    6 * scale,
    [180, 118, 55],
  );

  const pageLines = [
    [[164, 214], [234, 224]],
    [[164, 250], [234, 260]],
    [[348, 214], [278, 224]],
    [[348, 250], [278, 260]],
  ];
  pageLines.forEach(([from, to]) =>
    line(
      pixels,
      size,
      transform(from),
      transform(to),
      5 * scale,
      [119, 141, 157],
      0.72,
    ),
  );

  const heartSegments = [
    [[256, 357], [239, 329], [198, 334], [196, 371]],
    [[196, 371], [195, 405], [231, 427], [256, 440]],
    [[256, 440], [281, 427], [317, 405], [316, 371]],
    [[316, 371], [314, 334], [273, 329], [256, 357]],
  ].map((segment) => segment.map(transform));

  heartSegments.forEach((segment) =>
    cubic(pixels, size, segment, 20 * scale, [213, 139, 61], 0.12),
  );
  heartSegments.forEach((segment) =>
    cubic(pixels, size, segment, 9 * scale, [245, 195, 105]),
  );

  return pixels;
}

for (const output of OUTPUTS) {
  const target = resolve(ROOT, "public", "icons", output.name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    encodePng(
      output.size,
      output.size,
      renderIcon(output.size, output.markScale),
    ),
  );
  process.stdout.write(
    `generated ${output.name} (${output.size}x${output.size})\n`,
  );
}
