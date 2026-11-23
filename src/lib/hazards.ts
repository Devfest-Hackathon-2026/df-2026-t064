import type { HazardKey } from "./shelters";

// 災害の種類を画面に並べる順番（ラベルは辞書から取る）
// shelters.ts は server-only なので、ブラウザで使う値はこちらに置く
export const HAZARD_KEYS: HazardKey[] = [
  "earthquake",
  "flood",
  "landslide",
  "tsunami",
  "fire",
  "inlandFlood",
  "stormSurge",
  "volcano",
];
