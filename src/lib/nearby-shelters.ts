
import { calculateDistance } from "./distance";
import { loadNearbyShelters } from "./shelter-grid";
import type { Shelter } from "./shelters";

export type NearbyShelter = Shelter & {
    distance: number;
};

export async function findNearbyShelters(
    lat: number,
    lng: number,
    radius = 500
): Promise<NearbyShelter[]> {

    // ① 周辺グリッドの避難場所を取得
    const shelters = await loadNearbyShelters(lat, lng, radius);

    // ② 各避難場所との距離を計算
    const nearby = shelters
        .map((shelter) => ({
            ...shelter,
            distance: calculateDistance(
                lat,
                lng,
                shelter.lat,
                shelter.lng
            ),
        }))

        // ③ 指定半径以内だけ残す
        .filter((shelter) => shelter.distance <= radius)

        // ④ 近い順に並び替える
        .sort((a, b) => a.distance - b.distance);

    return nearby;
}
