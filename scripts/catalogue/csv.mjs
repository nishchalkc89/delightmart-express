// Minimal CSV reading/writing (quoted fields, commas and new lines inside quotes).

export function parseCsv(text) {
  const t = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (quoted) {
      if (c === '"' && t[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== '')) rows.push(row);
  return rows;
}

/** Array of objects -> CSV text (with a BOM so Excel opens it as UTF-8). */
export function toCsv(objects) {
  const keys = Object.keys(objects[0] ?? {});
  const cell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return `﻿${[keys.join(','), ...objects.map((o) => keys.map((k) => cell(o[k])).join(','))].join('\n')}\n`;
}

/** CSV text -> array of objects keyed by the header row. */
export function readObjects(text) {
  const [header, ...rows] = parseCsv(text);
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
