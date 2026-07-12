/**
 * pdf.js expects browser geometry types. Node/Vercel serverless does not
 * provide DOMMatrix, so we add a small stand-in before PDF parsing runs.
 */

type MatrixValues = [number, number, number, number, number, number];

class DomMatrixShim {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: string | number[]) {
    if (Array.isArray(init) && init.length >= 6) {
      const [a, b, c, d, e, f] = init as MatrixValues;
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.e = e;
      this.f = f;
    }
  }

  multiplySelf(other: DomMatrixShim) {
    const a = this.a * other.a + this.c * other.b;
    const b = this.b * other.a + this.d * other.b;
    const c = this.a * other.c + this.c * other.d;
    const d = this.b * other.c + this.d * other.d;
    const e = this.a * other.e + this.c * other.f + this.e;
    const f = this.b * other.e + this.d * other.f + this.f;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  translateSelf(tx = 0, ty = 0) {
    return this.multiplySelf(new DomMatrixShim([1, 0, 0, 1, tx, ty]));
  }

  scaleSelf(sx = 1, sy = sx) {
    return this.multiplySelf(new DomMatrixShim([sx, 0, 0, sy, 0, 0]));
  }

  inverse() {
    const det = this.a * this.d - this.b * this.c;
    if (!det) return new DomMatrixShim();
    return new DomMatrixShim([
      this.d / det,
      -this.b / det,
      -this.c / det,
      this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det,
    ]);
  }
}

export function ensureDomMatrix(): void {
  const g = globalThis as typeof globalThis & { DOMMatrix?: unknown };
  if (typeof g.DOMMatrix === "undefined") {
    // pdf.js only needs a constructor-shaped stand-in in Node; not a full browser DOMMatrix.
    g.DOMMatrix = DomMatrixShim as unknown;
  }
}

ensureDomMatrix();
