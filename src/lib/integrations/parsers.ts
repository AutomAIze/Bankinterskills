export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
}

export interface ParseResult {
  rows: ParsedRow[];
  headers: string[];
}

const SEPARATORS = [",", ";", "\t"];

function normalizeValue(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

function detectSeparator(line: string): string {
  let best = ",";
  let bestCount = -1;
  for (const sep of SEPARATORS) {
    const count = line.split(sep).length;
    if (count > bestCount) {
      best = sep;
      bestCount = count;
    }
  }
  return best;
}

export function parseDelimitedText(content: string): ParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { rows: [], headers: [] };

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeValue);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(normalizeValue);
    const raw: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[header] = values[idx] ?? "";
    });
    rows.push({ rowNumber: i + 1, raw });
  }

  return { rows, headers };
}

export function parseNumber(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
