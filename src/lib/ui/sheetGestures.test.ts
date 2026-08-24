import { describe, expect, it } from 'vitest';
import { shouldCloseSheetFromDrag } from './sheetGestures';

describe('shouldCloseSheetFromDrag', () => {
  it('fecha com deslocamento suficiente para baixo', () => {
    expect(shouldCloseSheetFromDrag(56, 0)).toBe(true);
  });

  it('fecha com gesto rápido para baixo', () => {
    expect(shouldCloseSheetFromDrag(10, 321)).toBe(true);
  });

  it('não fecha durante scroll curto ou gesto para cima', () => {
    expect(shouldCloseSheetFromDrag(30, 120)).toBe(false);
    expect(shouldCloseSheetFromDrag(-90, -500)).toBe(false);
  });
});
