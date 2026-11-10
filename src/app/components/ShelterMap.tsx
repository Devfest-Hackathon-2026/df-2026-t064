/// <reference types="google.maps" />
"use client"

import { useState, useEffect, useRef} from "react"
import { createPortal, flushSync } from "react-dom"
import { useBottomSheet, SHEET_MIN } from "../hooks/useBottomSheet";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { findNearbyShelters } from "../../lib/nearby-shelters";
import { calculateDistance } from "../../lib/distance";
import type { NearbyShelter } from "../../lib/nearby-shelters";
import type { HazardKey } from "../../lib/shelters";
import { ShelterCard } from "./ShelterCard";
import { useLanguage, readSavedLocale } from "../../i18n/LanguageProvider";
import { DEFAULT_LOCALE, type Locale } from "../../i18n/dictionaries";

let loadedLanguage: Locale | null = null;

function ensureMapsOptions() {
    if (loadedLanguage) return;
    const language = readSavedLocale() ?? DEFAULT_LOCALE;
    setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!,
        v: "weekly",
        language,
        region: "JP",
    });
    loadedLanguage = language;
}

type Props = {
    center: {lat: number, lng: number}
};

const SEARCH_RADIUS = 500;

function matchesHazard(shelter: NearbyShelter, hazard: HazardKey | null): boolean {
    return hazard === null || shelter.hazards[hazard] === true;
}

type ShelterMarker = {
    marker: google.maps.marker.AdvancedMarkerElement;
    shelter: NearbyShelter;
};

export function ShelterMap({ center }: Props){
    const mapRef = useRef<HTMLDivElement>(null);
    const [shelters, setShelters] = useState<NearbyShelter[]>([]);
    const [fetchFailed, setFetchFailed] = useState(false);
    const { t, locale } = useLanguage();

    const [selectedShelter, setSelectedShelter] = useState<NearbyShelter | null>(null);
    const [infoContent, setInfoContent] = useState<HTMLDivElement | null>(null);

    const [activeHazard, setActiveHazard] = useState<HazardKey | null>(null);
    const toggleHazard = (key: HazardKey) => {
        setActiveHazard((current) => (current === key ? null : key));
    };
    const visibleShelters = shelters.filter((s) => matchesHazard(s, activeHazard));

    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    const markersRef = useRef(new Map<string, ShelterMarker>());
    const activeHazardRef = useRef(activeHazard);

    useEffect(() => {
        activeHazardRef.current = activeHazard;
        const map = mapInstanceRef.current;
        if (!map) return;

        for (const { marker, shelter } of markersRef.current.values()) {
            marker.map = matchesHazard(shelter, activeHazard) ? map : null;
        }

        setSelectedShelter((selected) => {
            if (selected && !matchesHazard(selected, activeHazard)) {
                infoWindowRef.current?.close();
                return null;
            }
            return selected;
        });
    }, [activeHazard]);

    useEffect(() => {
        if (!loadedLanguage || locale === loadedLanguage) return;
        if (readSavedLocale() !== locale) return;
        window.location.reload();
    }, [locale]);


    const sheet = useBottomSheet();

    useEffect(() => {
        let cancelled = false;
        setFetchFailed(false);

        findNearbyShelters(center.lat, center.lng, SEARCH_RADIUS)
            .then((result) => {
                if (!cancelled) setShelters(result);
            })
            .catch((err) => {
                console.error(err);
                if (!cancelled) setFetchFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, [center]);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            ensureMapsOptions();
            const { Map, InfoWindow } = await importLibrary("maps");
            const { AdvancedMarkerElement, PinElement } = await importLibrary("marker");
            if (cancelled || !mapRef.current) return;

            const map = new Map(mapRef.current, {
                center,
                zoom: 16,
                mapId: 'DEMO_MAP_ID'
            });

            const content = document.createElement("div");
            setInfoContent(content);

            mapInstanceRef.current = map;

            const infoWindow = new InfoWindow({ maxWidth: 360 });
            infoWindowRef.current = infoWindow;
            infoWindow.addListener("closeclick", () => setSelectedShelter(null));

            const currentPin = new PinElement({
                background: "#2563eb",
                borderColor: "#1e40af",
                glyphColor: "white",
            });
            new AdvancedMarkerElement({
                map,
                position: center,
                title: t.currentLocation,
                content: currentPin.element,
            })

            const addMarkers = async (lat: number, lng: number) => {
                let result: NearbyShelter[];
                try {
                    result = await findNearbyShelters(lat, lng, SEARCH_RADIUS);
                } catch (err) {
                    console.error(err);
                    return;
                }
                if (cancelled) return;

                result.forEach((shelter) => {
                    if (markersRef.current.has(shelter.id)) return;

                    const marker = new AdvancedMarkerElement({
                        map: matchesHazard(shelter, activeHazardRef.current) ? map : null,
                        position: {lat: shelter.lat, lng:shelter.lng},
                        title: shelter.name,
                    });
                    markersRef.current.set(shelter.id, { marker, shelter });

                    marker.addListener('click', () => {
                        flushSync(() => setSelectedShelter(shelter));
                        infoWindow.setContent(content);
                        infoWindow.open({ map, anchor: marker });
                    });
                });
            }

            map.addListener('idle', () => {
                const c = map.getCenter();
                if(!c) return;
                addMarkers(c.lat(), c.lng());
            });

        };

        init().catch((err) => {
            console.error(err);
            if (!cancelled) setFetchFailed(true);
        });

        return () => {
            cancelled = true;
            for (const { marker } of markersRef.current.values()) {
                marker.map = null;
            }
            markersRef.current.clear();
            mapInstanceRef.current = null;
            infoWindowRef.current = null;
        };
    }, [center]);

    return (
        <div ref={sheet.containerRef} className="relative h-full w-full overflow-hidden bg-[#e5e3df]">
            <div
                ref={mapRef}
                className="absolute inset-x-0 top-0"
                style={{ bottom: `${SHEET_MIN}%` }}
            />

            {infoContent && selectedShelter && createPortal(
                <ShelterCard
                    compact
                    shelter={selectedShelter}
                    distance={calculateDistance(center.lat, center.lng, selectedShelter.lat, selectedShelter.lng)}
                    activeHazard={activeHazard}
                    onHazardClick={toggleHazard}
                />,
                infoContent,
            )}

            <div
                className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.15)] ${
                    sheet.isDragging ? "" : "transition-[height] duration-300 ease-out"
                }`}
                style={{ height: `${sheet.height}%` }}
                onWheel={sheet.handleWheel}
            >
                <div
                    className="shrink-0 cursor-grab touch-none select-none rounded-t-2xl px-4 pt-2 pb-3 active:cursor-grabbing"
                    {...sheet.dragHandlers}
                >
                    <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gray-300" />
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="font-semibold">{t.resultCount(visibleShelters.length)}</h2>

                        {activeHazard && (
                            <button
                                type="button"
                                onClick={() => setActiveHazard(null)}
                                aria-label={t.clearFilter}
                                className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-700"
                            >
                                {t.filteringBy(t.hazards[activeHazard])}
                                <span aria-hidden>✕</span>
                            </button>
                        )}
                    </div>
                </div>
                <div
                    ref={sheet.listRef}
                    className={`min-h-0 flex-1 overscroll-contain ${
                        sheet.isTop ? "overflow-y-auto" : "touch-none select-none overflow-hidden"
                    }`}
                    {...(sheet.isTop ? {} : sheet.dragHandlers)}
                >
                    <div className="flex flex-col gap-4 px-4 pb-6">
                        {fetchFailed && (
                            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {t.fetchError}
                            </p>
                        )}

                        {activeHazard && visibleShelters.length === 0 && (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-300 px-4 py-8 text-center">
                                <p className="text-slate-600">{t.noMatch(t.hazards[activeHazard])}</p>
                                <button
                                    type="button"
                                    onClick={() => setActiveHazard(null)}
                                    className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                >
                                    {t.clearFilter}
                                </button>
                            </div>
                        )}

                        {visibleShelters.map((shelter) => (
                            <ShelterCard
                                key={shelter.id}
                                shelter={shelter}
                                distance={calculateDistance(center.lat, center.lng, shelter.lat, shelter.lng)}
                                activeHazard={activeHazard}
                                onHazardClick={toggleHazard}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}