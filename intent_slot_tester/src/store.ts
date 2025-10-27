import type { AnnotationRecord } from "./types";

const KEY = "ist.records.v1";

function loadAll(): AnnotationRecord[] {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    return JSON.parse(s);
  } catch {
    return [];
  }
}

function saveAll(items: AnnotationRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function saveAnnotation(
  rec: Omit<AnnotationRecord, "id" | "createdAt">
) {
  const items = loadAll();
  const id = globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}`;
  const next: AnnotationRecord = {
    id,
    createdAt: new Date().toISOString(),
    ...rec,
  };
  items.unshift(next);
  saveAll(items);
}

export function listAnnotations(): AnnotationRecord[] {
  return loadAll();
}
