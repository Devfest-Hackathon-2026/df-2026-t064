"use client";

import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import type { LocationCandidate } from "../../../lib/geocode";
import type { PositionErrorKind } from "../../hooks/useCurrentPosition";
import { ManualLocationPicker } from "./ManualLocationPicker";

type Props = {
  error: PositionErrorKind;
  onRetry: () => void;
  onSelect: (location: LocationCandidate) => void;
};

// 現在地が取れなかったときの画面
// 「現在地をもう一度取得」か「場所を入力して探す」かを選べる
export function LocationFallback({ error, onRetry, onSelect }: Props) {
  const { t } = useLanguage();
  const [manual, setManual] = useState(false);

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      {manual ? (
        <ManualLocationPicker onSelect={onSelect} onBack={() => setManual(false)} />
      ) : (
        <div className="flex min-h-full flex-col items-center justify-center gap-6 text-center">
          <p role="alert" className="max-w-md text-slate-700">
            {t.locationErrors[error]}
          </p>

          <div className="flex w-full max-w-xs flex-col gap-3">
            {/* ブラウザが位置情報に対応していないときは、もう一度取得しても取れない */}
            {error !== "unsupported" && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                {t.manual.retryLocation}
              </button>
            )}
            <button
              type="button"
              onClick={() => setManual(true)}
              className="rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              {t.manual.chooseManually}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
