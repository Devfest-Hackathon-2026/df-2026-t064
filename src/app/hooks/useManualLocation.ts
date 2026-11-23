"use client";

import { useCallback, useEffect, useState } from "react";
import type { LocationCandidate } from "../../lib/geocode";

const STORAGE_KEY = "manualLocation";

function isLocationCandidate(value: unknown): value is LocationCandidate {
  const v = value as LocationCandidate | null;
  return (
    typeof v?.id === "string" &&
    typeof v.label === "string" &&
    Number.isFinite(v.position?.lat) &&
    Number.isFinite(v.position?.lng)
  );
}

// 手動で選んだ場所
// 言語を切り替えるとページを再読み込みするので、そのあとも同じ場所を表示できるよう
// sessionStorage に残しておく（タブを閉じると消える）
export function useManualLocation() {
  const [location, setLocationState] = useState<LocationCandidate | null>(null);

  // 保存されている場所を復元する（sessionStorage はブラウザでしか使えないので useEffect の中）
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      if (isLocationCandidate(saved)) setLocationState(saved);
    } catch {
      // 読めなければ保存されていないのと同じ扱い
    }
  }, []);

  const setLocation = useCallback((next: LocationCandidate | null) => {
    setLocationState(next);
    try {
      if (next) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // 保存できなくても、この画面では使える
    }
  }, []);

  return [location, setLocation] as const;
}
