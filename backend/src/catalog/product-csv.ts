import { inArray, or } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { products } from '../db/schema.ts';
import { validateProductInput } from './product-validation.ts';

const columns = ['id', 'slug', 'name', 'category', 'pricePaise', 'material', 'description', 'image', 'size', 'lead', 'gallery'] as const;
const maxRows = 50;
const maxBytes = 64 * 1024;

function parseRows(input: string): string[][] {
  if (Buffer.byteLength(input, 'utf8') > maxBytes) throw new Error('CSV must be 64 KiB or smaller.');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const character = input[i];
    if (quoted) {
      if (character === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell.length === 0) quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted value.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  if (rows.length < 2) throw new Error('CSV must include a header and at least one product.');
  if (rows.length - 1 > maxRows) throw new Error(`CSV is limited to ${maxRows} products per import.`);
  if (rows[0].map((value) => value.trim()).join(',') !== columns.join(',')) throw new Error(`CSV headers must be: ${columns.join(',')}`);
  if (rows.some((values) => values.length !== columns.length)) throw new Error('Every CSV row must have exactly 11 columns.');
  return rows.slice(1);
}

export async function previewProductCsv(input: string) {
  const rows = parseRows(input);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const candidates: Array<{ rowNumber: number; input: ReturnType<typeof validateProductInput>; errors: string[] }> = [];
  rows.forEach((values, index) => {
    const data = {
      id: values[0].trim(), slug: values[1].trim(), name: values[2].trim(), category: values[3].trim(),
      pricePaise: Number(values[4].trim()), material: values[5].trim(), description: values[6].trim(),
      image: values[7].trim(), size: values[8].trim(), lead: values[9].trim(),
      gallery: values[10].split('|').map((path) => path.trim()).filter(Boolean),
    };
    const validated = validateProductInput({ ...data, isPublished: false });
    const errors: string[] = [];
    if (!validated) errors.push('Product fields are invalid (check category, paise price, lengths, ID, slug and image paths).');
    if (ids.has(values[0])) errors.push('Duplicate product ID in this file.');
    if (slugs.has(values[1])) errors.push('Duplicate product slug in this file.');
    ids.add(values[0]); slugs.add(values[1]);
    candidates.push({ rowNumber: index + 2, input: validated, errors });
  });
  const idValues = [...ids];
  const slugValues = [...slugs];
  const existing = idValues.length ? await db.select({ id: products.id, slug: products.slug }).from(products).where(or(inArray(products.id, idValues), inArray(products.slug, slugValues))) : [];
  const existingIds = new Set(existing.map((item) => item.id));
  const existingSlugs = new Set(existing.map((item) => item.slug));
  const results = candidates.map((candidate, index) => {
    const raw = rows[index];
    if (existingIds.has(raw[0])) candidate.errors.push('Product ID already exists.');
    if (existingSlugs.has(raw[1])) candidate.errors.push('Product slug already exists.');
    return { row: candidate.rowNumber, id: raw[0], name: raw[2], errors: candidate.errors };
  });
  const items = candidates.filter((candidate) => candidate.errors.length === 0).map((candidate) => candidate.input!);
  return { valid: results.every((result) => result.errors.length === 0), rows: results, items };
}
