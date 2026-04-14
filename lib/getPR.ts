
export function getPR(data: any[]) {
  if (!data || data.length === 0) return 0;

  return Math.max(...data.map(d => d.max_weight || 0));
}
