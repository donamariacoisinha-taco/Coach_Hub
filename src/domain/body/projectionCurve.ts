/**
 * Higher weight sits higher on the chart (smaller SVG y).
 * A series that falls is drawn downward. Fewer than two numbers returns null.
 */
/** Month marks drawn on the projection curve. The header must use this same span. */
export function monthsOnProjectionChart(currentWeight: number, targetWeight: number): number {
  if (!(currentWeight > 0) || !(targetWeight > 0) || currentWeight === targetWeight) return 0;
  return 4;
}

export function projectionYs(weights: number[], top = 18, bottom = 102): number[] | null {
  const values = weights.filter((value) => Number.isFinite(value));
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value) => bottom - ((value - min) / span) * (bottom - top));
}
