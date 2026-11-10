export const GRID_SIZE = 0.02;

export function toGridIndex(degree: number): number {
  return Math.floor(degree / GRID_SIZE);
}

export function formatGridId(latIndex: number, lngIndex: number): string {
  return `${latIndex}_${lngIndex}`;
}

export function getGridId(lat: number, lng: number): string {
  return formatGridId(toGridIndex(lat), toGridIndex(lng));
}
