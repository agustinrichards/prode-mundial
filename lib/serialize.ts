export function serializeDate(val: any): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export function serializeDates(rows: any[], fields: string[]): any[] {
  return rows.map(row => {
    const out = { ...row };
    for (const f of fields) {
      if (f in out) (out as any)[f] = serializeDate(out[f]);
    }
    return out;
  });
}