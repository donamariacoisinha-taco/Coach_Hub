import { describe, expect, it } from 'vitest';
import { monthsOnProjectionChart, projectionYs } from './projectionCurve';

describe('curva de projeção', () => {
  it('desce quando os valores caem', () => {
    const ys = projectionYs([90, 84, 78]);
    expect(ys).not.toBeNull();
    expect(ys![0]).toBeLessThan(ys![1]);
    expect(ys![1]).toBeLessThan(ys![2]);
  });

  it('sobe quando os valores sobem', () => {
    const ys = projectionYs([70, 74, 80]);
    expect(ys![0]).toBeGreaterThan(ys![2]);
  });

  it('não inventa uma curva sem dois números', () => {
    expect(projectionYs([80])).toBeNull();
  });

  it('o prazo do cabeçalho é o mesmo da curva', () => {
    expect(monthsOnProjectionChart(89.5, 88)).toBe(4);
    expect(monthsOnProjectionChart(88, 88)).toBe(0);
  });
});
