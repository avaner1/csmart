"use client";

import { useState, useEffect, useCallback } from "react";

const savedSet = new Set<string>();
let loaded = false;

export function useSavedItems() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loaded) {
      setSavedIds(new Set(savedSet));
      return;
    }
    fetch("/api/saved?idsOnly=true")
      .then((r) => r.json())
      .then((data) => {
        savedSet.clear();
        (data.savedSourceIds ?? []).forEach((id: string) => savedSet.add(id));
        loaded = true;
        setSavedIds(new Set(savedSet));
      })
      .catch(() => {});
  }, []);

  const isSaved = useCallback(
    (sourceType: string, sourceId: string) =>
      savedIds.has(`${sourceType}:${sourceId}`),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (item: {
      sourceType: string;
      sourceId: string;
      title: string;
      content: string;
      sourceUrl?: string;
    }) => {
      const key = `${item.sourceType}:${item.sourceId}`;
      const wasSaved = savedSet.has(key);

      if (wasSaved) {
        savedSet.delete(key);
        setSavedIds(new Set(savedSet));
        await fetch("/api/saved", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: item.sourceType,
            sourceId: item.sourceId,
          }),
        });
      } else {
        savedSet.add(key);
        setSavedIds(new Set(savedSet));
        await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }

      return !wasSaved;
    },
    []
  );

  return { isSaved, toggleSave };
}
