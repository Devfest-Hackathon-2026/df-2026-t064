"use client";

import { useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";

const SHEET_STAGES = [15, 45, 90] as const;
const TOP_STAGE = SHEET_STAGES.length - 1;
const DEFAULT_STAGE = 0;
const FLICK_PERCENT = 5;
const WHEEL_COOLDOWN = 500;

export const SHEET_MIN = SHEET_STAGES[0];
const SHEET_MAX = SHEET_STAGES[TOP_STAGE];

export function useBottomSheet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [stage, setStage] = useState(DEFAULT_STAGE);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const lastWheelRef = useRef(0);

  const isTop = stage === TOP_STAGE;
  const isDragging = dragHeight !== null;
  const height = dragHeight ?? SHEET_STAGES[stage];

  const changeStage = (next: number) => {
    const clamped = Math.min(TOP_STAGE, Math.max(0, next));

    if (clamped !== TOP_STAGE && listRef.current) {
      listRef.current.scrollTop = 0;
    }
    setStage(clamped);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startHeight: SHEET_STAGES[stage] };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;

    const movedPercent = ((drag.startY - e.clientY) / container.clientHeight) * 100;
    const next = drag.startHeight + movedPercent;
    setDragHeight(Math.min(SHEET_MAX, Math.max(SHEET_MIN, next)));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || dragHeight === null) {
      setDragHeight(null);
      return;
    }

    let nearest = 0;
    SHEET_STAGES.forEach((h, i) => {
      if (Math.abs(h - dragHeight) < Math.abs(SHEET_STAGES[nearest] - dragHeight)) {
        nearest = i;
      }
    });

    const moved = dragHeight - drag.startHeight;
    if (nearest === stage && Math.abs(moved) >= FLICK_PERCENT) {
      nearest = stage + (moved > 0 ? 1 : -1);
    }

    setDragHeight(null);
    changeStage(nearest);
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelRef.current < WHEEL_COOLDOWN) return;

    if (!isTop) {
      if (e.deltaY > 0) changeStage(stage + 1);
      else if (e.deltaY < 0) changeStage(stage - 1);
      else return;
      lastWheelRef.current = now;
      return;
    }

    if (e.deltaY < 0 && listRef.current && listRef.current.scrollTop <= 0) {
      changeStage(stage - 1);
      lastWheelRef.current = now;
    }
  };

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  return {
    containerRef,
    listRef,
    height,
    isTop,
    isDragging,
    dragHandlers,
    handleWheel,
  };
}
