import type { Shelter } from "./shelters";
import { formatGridId, toGridIndex } from "./grid";

// 緯度 1 度あたりの距離（メートル）
const METERS_PER_DEGREE = 111320;

export function getNearbyGridIds(
  lat: number,
  lng: number,
  radius = 500
): string[] {
  const latDelta = radius / METERS_PER_DEGREE;
  const lngDelta =
    radius / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180));

  const minLat = toGridIndex(lat - latDelta);
  const maxLat = toGridIndex(lat + latDelta);
  const minLng = toGridIndex(lng - lngDelta);
  const maxLng = toGridIndex(lng + lngDelta);

  const ids: string[] = [];

  for (let i = minLat; i <= maxLat; i++) {
    for (let j = minLng; j <= maxLng; j++) {
      ids.push(formatGridId(i, j));
    }
  }

  return ids;
}

const gridCache = new Map<string, Promise<Shelter[]>>();

async function fetchGrid(id: string): Promise<Shelter[]> {
  const response = await fetch(`/data/grids/${id}.json`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`グリッド取得失敗: ${id} (${response.status})`);
  }

  return (await response.json()) as Shelter[];
}

function loadGrid(id: string): Promise<Shelter[]> {
  const cached = gridCache.get(id);
  if (cached) return cached;

  const promise = fetchGrid(id).catch((err) => {
    gridCache.delete(id);
    throw err;
  });
  gridCache.set(id, promise);
  return promise;
}

export async function loadNearbyShelters(
  lat: number,
  lng: number,
  radius = 500
): Promise<Shelter[]> {
  const gridIds = getNearbyGridIds(lat, lng, radius);
  const results = await Promise.all(gridIds.map(loadGrid));
  return results.flat();
}
