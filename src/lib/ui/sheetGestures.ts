export const shouldCloseSheetFromDrag = (
  offsetY: number,
  velocityY: number,
  offsetThreshold = 55,
  velocityThreshold = 320,
): boolean => offsetY > offsetThreshold || velocityY > velocityThreshold;
