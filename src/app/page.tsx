"use client";

import { useCurrentPosition } from "./hooks/useCurrentPosition";
import { useManualLocation } from "./hooks/useManualLocation";
import { ShelterMap } from "./components/ShelterMap";
import { LocationFallback } from "./components/location/LocationFallback";
import { ChangeLocationButton } from "./components/location/ChangeLocationButton";
import { useLanguage } from "../i18n/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();
  const { position, error, retry } = useCurrentPosition();
  const [manualLocation, setManualLocation] = useManualLocation();

  return (
    <main className="relative min-h-0 flex-1">
      {manualLocation ? (
        <ShelterMap
          center={manualLocation.position}
          centerLabel={t.manual.selectedLocation}
          useCenterAsRouteOrigin={!position}
          topOverlay={<ChangeLocationButton onClick={() => setManualLocation(null)} />}
        />
      ) : position ? (
        <ShelterMap center={position} />
      ) : error ? (
        <LocationFallback error={error} onRetry={retry} onSelect={setManualLocation} />
      ) : (
        <div
          role="status"
          className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center"
        >
          <div
            aria-hidden
            className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
          />
          <p className="text-slate-600">{t.locating}</p>
        </div>
      )}
    </main>
  );
}
