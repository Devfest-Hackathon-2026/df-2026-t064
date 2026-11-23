"use client";

import { useCallback, useRef, useState } from "react";
import type { LocationCandidate } from "../../lib/geocode";

export type LocationSearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; candidates: LocationCandidate[] }
  | { status: "error" };

// 場所の検索（住所・郵便番号 / 都道府県＋建物名）の状態をまとめて扱う
export function useLocationSearch() {
  const [state, setState] = useState<LocationSearchState>({ status: "idle" });
  // 続けて検索したとき、古い検索の結果で上書きしないための番号
  const latestRequest = useRef(0);

  // 検索を実行して、見つかった候補を返す（古い検索・失敗したときは null）
  const run = useCallback(
    async (search: () => Promise<LocationCandidate[]>): Promise<LocationCandidate[] | null> => {
      const request = ++latestRequest.current;
      setState({ status: "loading" });
      try {
        const candidates = await search();
        if (request !== latestRequest.current) return null;
        setState({ status: "done", candidates });
        return candidates;
      } catch (err) {
        console.error(err);
        if (request === latestRequest.current) setState({ status: "error" });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    latestRequest.current++;
    setState({ status: "idle" });
  }, []);

  return { state, run, reset };
}
