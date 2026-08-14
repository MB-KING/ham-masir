/**
 * Satori (next/og) does not shape Arabic/Persian. Convert to presentation
 * forms and visual LTR order so letters join and read right-to-left.
 */

type GlyphRow = [
  number,
  number,
  number | null,
  number | null,
  number | null
];

const CHARS: GlyphRow[] = [
  [0x0621, 0xfe80, null, null, null],
  [0x0622, 0xfe81, null, null, 0xfe82],
  [0x0623, 0xfe83, null, null, 0xfe84],
  [0x0624, 0xfe85, null, null, 0xfe86],
  [0x0625, 0xfe87, null, null, 0xfe88],
  [0x0626, 0xfe89, 0xfe8b, 0xfe8c, 0xfe8a],
  [0x0627, 0xfe8d, null, null, 0xfe8e],
  [0x0628, 0xfe8f, 0xfe91, 0xfe92, 0xfe90],
  [0x0629, 0xfe93, null, null, 0xfe94],
  [0x062a, 0xfe95, 0xfe97, 0xfe98, 0xfe96],
  [0x062b, 0xfe99, 0xfe9b, 0xfe9c, 0xfe9a],
  [0x062c, 0xfe9d, 0xfe9f, 0xfea0, 0xfe9e],
  [0x062d, 0xfea1, 0xfea3, 0xfea4, 0xfea2],
  [0x062e, 0xfea5, 0xfea7, 0xfea8, 0xfea6],
  [0x062f, 0xfea9, null, null, 0xfeaa],
  [0x0630, 0xfeab, null, null, 0xfeac],
  [0x0631, 0xfead, null, null, 0xfeae],
  [0x0632, 0xfeaf, null, null, 0xfeb0],
  [0x0633, 0xfeb1, 0xfeb3, 0xfeb4, 0xfeb2],
  [0x0634, 0xfeb5, 0xfeb7, 0xfeb8, 0xfeb6],
  [0x0635, 0xfeb9, 0xfebb, 0xfebc, 0xfeba],
  [0x0636, 0xfebd, 0xfebf, 0xfec0, 0xfebe],
  [0x0637, 0xfec1, 0xfec3, 0xfec4, 0xfec2],
  [0x0638, 0xfec5, 0xfec7, 0xfec8, 0xfec6],
  [0x0639, 0xfec9, 0xfecb, 0xfecc, 0xfeca],
  [0x063a, 0xfecd, 0xfecf, 0xfed0, 0xfece],
  [0x0640, 0x0640, 0x0640, 0x0640, 0x0640],
  [0x0641, 0xfed1, 0xfed3, 0xfed4, 0xfed2],
  [0x0642, 0xfed5, 0xfed7, 0xfed8, 0xfed6],
  [0x0643, 0xfed9, 0xfedb, 0xfedc, 0xfeda],
  [0x0644, 0xfedd, 0xfedf, 0xfee0, 0xfede],
  [0x0645, 0xfee1, 0xfee3, 0xfee4, 0xfee2],
  [0x0646, 0xfee5, 0xfee7, 0xfee8, 0xfee6],
  [0x0647, 0xfee9, 0xfeeb, 0xfeec, 0xfeea],
  [0x0648, 0xfeed, null, null, 0xfeee],
  [0x0649, 0xfeef, null, null, 0xfef0],
  [0x064a, 0xfef1, 0xfef3, 0xfef4, 0xfef2],
  [0x067e, 0xfb56, 0xfb58, 0xfb59, 0xfb57],
  [0x0686, 0xfb7a, 0xfb7c, 0xfb7d, 0xfb7b],
  [0x0698, 0xfb8a, null, null, 0xfb8b],
  [0x06a9, 0xfb8e, 0xfb90, 0xfb91, 0xfb8f],
  [0x06af, 0xfb92, 0xfb94, 0xfb95, 0xfb93],
  [0x06cc, 0xfbfc, 0xfbfe, 0xfbff, 0xfbfd]
];

const LAM_ALEF: Array<[number, number, number, number]> = [
  [0x0622, 0xfef5, 0xfef6, 0x0622],
  [0x0623, 0xfef7, 0xfef8, 0x0623],
  [0x0625, 0xfef9, 0xfefa, 0x0625],
  [0x0627, 0xfefb, 0xfefc, 0x0627]
];

const CHAR_MAP = new Map<number, GlyphRow>(CHARS.map((row) => [row[0], row]));

function isTransparent(code: number) {
  return (
    (code >= 0x064b && code <= 0x0658) ||
    code === 0x0670 ||
    (code >= 0x0610 && code <= 0x0615)
  );
}

function connectsFromPrevious(code: number) {
  const row = CHAR_MAP.get(code);
  return Boolean(row && (row[2] != null || row[3] != null));
}

function connectsToPrevious(code: number) {
  const row = CHAR_MAP.get(code);
  return Boolean(row && (row[3] != null || row[4] != null));
}

function skipTransparent(text: string, index: number, step: number) {
  let i = index + step;
  while (i >= 0 && i < text.length && isTransparent(text.charCodeAt(i))) {
    i += step;
  }
  return i;
}

export function reshapePersian(text: string) {
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const current = text.charCodeAt(i);
    const row = CHAR_MAP.get(current);
    if (!row) {
      out += text[i];
      continue;
    }

    const prevIndex = skipTransparent(text, i, -1);
    const nextIndex = skipTransparent(text, i, 1);
    const prev = prevIndex >= 0 ? text.charCodeAt(prevIndex) : null;
    const next = nextIndex < text.length ? text.charCodeAt(nextIndex) : null;
    const prevConnects = prev != null && connectsFromPrevious(prev);
    const nextConnects = next != null && connectsToPrevious(next);

    if (current === 0x0644 && next != null) {
      const ligature = LAM_ALEF.find((item) => item[0] === next);
      if (ligature) {
        out += String.fromCharCode(prevConnects ? ligature[2] : ligature[1]);
        i = nextIndex;
        continue;
      }
    }

    if (prevConnects && nextConnects && row[3] != null) {
      out += String.fromCharCode(row[3]);
    } else if (prevConnects && row[4] != null) {
      out += String.fromCharCode(row[4]);
    } else if (nextConnects && row[2] != null) {
      out += String.fromCharCode(row[2]);
    } else {
      out += String.fromCharCode(row[1]);
    }
  }
  return out;
}

function isLtrStrong(code: number) {
  return (
    (code >= 0x0030 && code <= 0x0039) ||
    (code >= 0x0041 && code <= 0x005a) ||
    (code >= 0x0061 && code <= 0x007a) ||
    (code >= 0x0660 && code <= 0x0669) ||
    (code >= 0x06f0 && code <= 0x06f9)
  );
}

function isLtrRunChar(code: number) {
  return (
    isLtrStrong(code) ||
    code === 0x003a ||
    code === 0x002f ||
    code === 0x002e ||
    code === 0x002d
  );
}

/** Reverse for LTR engines, keeping numbers and Latin in reading order. */
export function visualRtl(text: string) {
  const chars = Array.from(text);
  const visual: string[] = [];
  let i = chars.length - 1;
  while (i >= 0) {
    const code = chars[i].codePointAt(0) ?? 0;
    if (isLtrStrong(code)) {
      const run: string[] = [];
      while (i >= 0 && isLtrRunChar(chars[i].codePointAt(0) ?? 0)) {
        run.push(chars[i]);
        i -= 1;
      }
      visual.push(...run.reverse());
      continue;
    }
    visual.push(chars[i]);
    i -= 1;
  }
  return visual.join("");
}

export function persianForOg(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return visualRtl(reshapePersian(text));
}
