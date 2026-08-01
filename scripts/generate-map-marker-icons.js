const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "miniprogram/assets/map");
const SCALE = 4;
const WIDTH = 96;
const HEIGHT = 112;

function rgba(hex, alpha = 255) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    alpha,
  ];
}

function makeCanvas() {
  return {
    width: WIDTH * SCALE,
    height: HEIGHT * SCALE,
    data: new Uint8ClampedArray(WIDTH * SCALE * HEIGHT * SCALE * 4),
  };
}

function blendPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const offset = (y * canvas.width + x) * 4;
  const srcA = color[3] / 255;
  const dstA = canvas.data[offset + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;

  for (let i = 0; i < 3; i += 1) {
    const src = color[i] / 255;
    const dst = canvas.data[offset + i] / 255;
    canvas.data[offset + i] =
      Math.round(((src * srcA + dst * dstA * (1 - srcA)) / outA) * 255);
  }
  canvas.data[offset + 3] = Math.round(outA * 255);
}

function eachPixel(canvas, minX, minY, maxX, maxY, predicate, color) {
  const left = Math.max(0, Math.floor(minX * SCALE));
  const top = Math.max(0, Math.floor(minY * SCALE));
  const right = Math.min(canvas.width - 1, Math.ceil(maxX * SCALE));
  const bottom = Math.min(canvas.height - 1, Math.ceil(maxY * SCALE));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (predicate(x / SCALE, y / SCALE)) blendPixel(canvas, x, y, color);
    }
  }
}

function drawCircle(canvas, cx, cy, r, color) {
  const rr = r * r;
  eachPixel(
    canvas,
    cx - r,
    cy - r,
    cx + r,
    cy + r,
    (x, y) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr,
    color,
  );
}

function drawEllipse(canvas, cx, cy, rx, ry, color) {
  eachPixel(
    canvas,
    cx - rx,
    cy - ry,
    cx + rx,
    cy + ry,
    (x, y) => ((x - cx) * (x - cx)) / (rx * rx) + ((y - cy) * (y - cy)) / (ry * ry) <= 1,
    color,
  );
}

function drawRoundedRect(canvas, x, y, w, h, r, color) {
  eachPixel(
    canvas,
    x,
    y,
    x + w,
    y + h,
    (px, py) => {
      const dx = Math.max(x + r - px, 0, px - (x + w - r));
      const dy = Math.max(y + r - py, 0, py - (y + h - r));
      return dx * dx + dy * dy <= r * r;
    },
    color,
  );
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawPolygon(canvas, points, color) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  eachPixel(
    canvas,
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
    (x, y) => insidePolygon(x, y, points),
    color,
  );
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - x1, py - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - x2, py - y2);
  const b = c1 / c2;
  return Math.hypot(px - (x1 + b * vx), py - (y1 + b * vy));
}

function drawLine(canvas, x1, y1, x2, y2, width, color) {
  const r = width / 2;
  eachPixel(
    canvas,
    Math.min(x1, x2) - r,
    Math.min(y1, y2) - r,
    Math.max(x1, x2) + r,
    Math.max(y1, y2) + r,
    (x, y) => distanceToSegment(x, y, x1, y1, x2, y2) <= r,
    color,
  );
}

function drawRing(canvas, cx, cy, r, width, color) {
  const outer = r * r;
  const inner = (r - width) * (r - width);
  eachPixel(
    canvas,
    cx - r,
    cy - r,
    cx + r,
    cy + r,
    (x, y) => {
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      return d <= outer && d >= inner;
    },
    color,
  );
}

function drawMarkerBase(canvas, color) {
  const white = rgba("#FBFFFC");
  const shadow = rgba("#193C3A", 40);
  const main = rgba(color);
  const accent = rgba("#D9F0E7", 155);

  drawEllipse(canvas, 48, 102, 24, 7, shadow);
  drawPolygon(canvas, [[29, 61], [48, 106], [67, 61]], white);
  drawCircle(canvas, 48, 43, 36, white);
  drawPolygon(canvas, [[35, 61], [48, 98], [61, 61]], main);
  drawCircle(canvas, 48, 43, 29, main);
  drawEllipse(canvas, 39, 32, 11, 6, accent);
}

function iconScenic(canvas, color) {
  const c = rgba("#FBFFFC");
  drawCircle(canvas, 58, 31, 4, c);
  drawLine(canvas, 28, 56, 41, 39, 5, c);
  drawLine(canvas, 41, 39, 53, 56, 5, c);
  drawLine(canvas, 43, 56, 58, 43, 5, c);
  drawLine(canvas, 58, 43, 70, 56, 5, c);
  drawLine(canvas, 26, 58, 70, 58, 5, c);
  drawCircle(canvas, 38, 50, 2.4, rgba(color));
}

function iconStation(canvas) {
  const c = rgba("#FBFFFC");
  drawLine(canvas, 28, 48, 48, 31, 5, c);
  drawLine(canvas, 48, 31, 68, 48, 5, c);
  drawRoundedRect(canvas, 33, 47, 30, 21, 3, c);
  drawRoundedRect(canvas, 44, 55, 8, 13, 2, rgba("#0F6B67"));
  drawLine(canvas, 29, 68, 67, 68, 5, c);
}

function iconFood(canvas) {
  const c = rgba("#FBFFFC");
  drawRoundedRect(canvas, 31, 43, 29, 20, 6, c);
  drawRoundedRect(canvas, 57, 48, 9, 10, 5, c);
  drawRoundedRect(canvas, 57, 51, 5, 5, 2, rgba("#0F6B67"));
  drawLine(canvas, 30, 66, 66, 66, 4, c);
  drawLine(canvas, 39, 34, 35, 26, 3, c);
  drawLine(canvas, 49, 34, 48, 25, 3, c);
  drawLine(canvas, 58, 34, 62, 26, 3, c);
}

function iconStay(canvas) {
  const c = rgba("#FBFFFC");
  drawLine(canvas, 28, 45, 28, 68, 5, c);
  drawRoundedRect(canvas, 31, 45, 35, 12, 5, c);
  drawRoundedRect(canvas, 32, 57, 40, 11, 3, c);
  drawLine(canvas, 72, 50, 72, 68, 5, c);
  drawCircle(canvas, 39, 51, 3, rgba("#0F6B67"));
}

function iconParking(canvas) {
  const c = rgba("#FBFFFC");
  drawRoundedRect(canvas, 27, 46, 42, 15, 5, c);
  drawPolygon(canvas, [[36, 46], [43, 37], [58, 37], [64, 46]], c);
  drawCircle(canvas, 37, 63, 6, c);
  drawCircle(canvas, 59, 63, 6, c);
  drawCircle(canvas, 37, 63, 2.5, rgba("#0F6B67"));
  drawCircle(canvas, 59, 63, 2.5, rgba("#0F6B67"));
}

function iconToilet(canvas) {
  const c = rgba("#FBFFFC");
  drawCircle(canvas, 39, 33, 5, c);
  drawLine(canvas, 39, 41, 39, 58, 5, c);
  drawLine(canvas, 31, 47, 47, 47, 4, c);
  drawLine(canvas, 39, 58, 32, 69, 4, c);
  drawLine(canvas, 39, 58, 46, 69, 4, c);
  drawCircle(canvas, 58, 33, 5, c);
  drawPolygon(canvas, [[58, 41], [48, 61], [68, 61]], c);
  drawLine(canvas, 54, 61, 54, 70, 4, c);
  drawLine(canvas, 62, 61, 62, 70, 4, c);
}

function iconFarm(canvas) {
  const c = rgba("#FBFFFC");
  drawEllipse(canvas, 40, 48, 8, 17, c);
  drawEllipse(canvas, 56, 48, 8, 17, c);
  drawLine(canvas, 48, 39, 48, 70, 4, c);
  drawLine(canvas, 35, 65, 61, 65, 4, c);
  drawLine(canvas, 33, 55, 25, 48, 3, c);
  drawLine(canvas, 63, 55, 72, 48, 3, c);
}

function iconLive(canvas) {
  const c = rgba("#FBFFFC");
  drawRoundedRect(canvas, 28, 42, 33, 22, 5, c);
  drawPolygon(canvas, [[61, 48], [73, 42], [73, 64], [61, 58]], c);
  drawCircle(canvas, 44, 53, 6, rgba("#0F6B67"));
  drawCircle(canvas, 44, 53, 3, c);
}

function iconMarket(canvas) {
  const c = rgba("#FBFFFC");
  drawRoundedRect(canvas, 30, 48, 36, 20, 5, c);
  drawLine(canvas, 37, 49, 43, 36, 4, c);
  drawLine(canvas, 59, 49, 53, 36, 4, c);
  drawLine(canvas, 39, 58, 57, 58, 3, rgba("#0F6B67"));
  drawLine(canvas, 41, 48, 41, 67, 2.5, rgba("#0F6B67"));
  drawLine(canvas, 55, 48, 55, 67, 2.5, rgba("#0F6B67"));
}

function iconService(canvas) {
  const c = rgba("#FBFFFC");
  drawRoundedRect(canvas, 31, 33, 34, 34, 7, c);
  drawCircle(canvas, 48, 42, 3, rgba("#0F6B67"));
  drawLine(canvas, 48, 49, 48, 59, 5, rgba("#0F6B67"));
  drawLine(canvas, 43, 59, 53, 59, 4, rgba("#0F6B67"));
}

function iconDefault(canvas) {
  const c = rgba("#FBFFFC");
  drawRing(canvas, 48, 47, 17, 5, c);
  drawCircle(canvas, 48, 47, 5, c);
}

const icons = [
  ["marker-scenic.png", "#0F6B67", iconScenic],
  ["marker-station.png", "#167A64", iconStation],
  ["marker-food.png", "#C95C2D", iconFood],
  ["marker-stay.png", "#2B6F87", iconStay],
  ["marker-parking.png", "#2477C7", iconParking],
  ["marker-toilet.png", "#5E7F7A", iconToilet],
  ["marker-farm.png", "#5D8B38", iconFarm],
  ["marker-live.png", "#8A5BBA", iconLive],
  ["marker-market.png", "#B97925", iconMarket],
  ["marker-service.png", "#0F6B67", iconService],
  ["marker-default.png", "#607F7A", iconDefault],
];

function downsample(canvas) {
  const out = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let sy = 0; sy < SCALE; sy += 1) {
        for (let sx = 0; sx < SCALE; sx += 1) {
          const srcOffset =
            ((y * SCALE + sy) * canvas.width + (x * SCALE + sx)) * 4;
          for (let i = 0; i < 4; i += 1) totals[i] += canvas.data[srcOffset + i];
        }
      }
      const dstOffset = (y * WIDTH + x) * 4;
      for (let i = 0; i < 4; i += 1) {
        out[dstOffset + i] = Math.round(totals[i] / (SCALE * SCALE));
      }
    }
  }
  return out;
}

function crcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function pngBuffer(rgbaData) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowOffset = y * (WIDTH * 4 + 1);
    raw[rowOffset] = 0;
    rgbaData.copy(raw, rowOffset + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

icons.forEach(([filename, color, drawIcon]) => {
  const canvas = makeCanvas();
  drawMarkerBase(canvas, color);
  drawIcon(canvas, color);
  fs.writeFileSync(path.join(OUT_DIR, filename), pngBuffer(downsample(canvas)));
});

console.log(`generated ${icons.length} marker icons`);
