export function serializeDate(val: any): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export function serializeDates<T extends Record<string, any>>(
  rows: T[],
  fields: string[]
): T[] {
  return rows.map(row => {
    const out = { ...row };
    for (const f of fields) {
      if (f in out) out[f] = serializeDate(out[f]);
    }
    return out;
  });
}