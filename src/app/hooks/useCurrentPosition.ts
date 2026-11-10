"use client";

import { useCallback, useEffect, useState } from "react";

export type LatLng = { lat: number; lng: number };

// 位置情報が取れなかった理由（表示する文言は辞書の locationErrors から引く）
export type PositionErrorKind = "unsupported" | "denied" | "unavailable" | "timeout";

// 取得時間と、使い回してよい古い位置の有効期間
const GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 10_000,
  maximumAge: 60_000,
};

function toErrorKind(error: GeolocationPositionError): PositionErrorKind {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "denied";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "unavailable";
  }
}

export function useCurrentPosition() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<PositionErrorKind | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("unsupported");
      return;
    }

    let cancelled = false;
    setError(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled) return;
        setPosition({ lat: coords.latitude, lng: coords.longitude });
      },
      (err) => {
        if (cancelled) return;
        setError(toErrorKind(err));
      },
      GEOLOCATION_OPTIONS,
    );

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { position, error, retry };
}
