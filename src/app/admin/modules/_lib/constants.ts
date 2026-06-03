import type { ModuleGroupRecord } from "@/infrastructure/http/adminApi";

// Palette used when group slug doesn't match a known entry
const GROUP_PALETTE = ["#1677ff", "#0ca678", "#722ed1", "#f5a623", "#e8475f"];

// Slug-based overrides for known groups (UI enhancement, not required)
const SLUG_COLOR: Record<string, string> = {
  "dieu-hanh": "#1677ff",
  executive:   "#1677ff",
  "lam-sang":  "#0ca678",
  clinical:    "#0ca678",
  diagnostic:  "#0ca678",
  "quan-tri":  "#722ed1",
  operations:  "#722ed1",
  "ai-analytics": "#f5a623",
};

export function resolveGroupColor(group: ModuleGroupRecord, allGroups: ModuleGroupRecord[]): string {
  if (SLUG_COLOR[group.slug]) return SLUG_COLOR[group.slug];
  const idx = allGroups.findIndex((g) => g.id === group.id);
  return GROUP_PALETTE[idx % GROUP_PALETTE.length];
}

export function groupColorById(id: string, groups: ModuleGroupRecord[]): string {
  const g = groups.find((gr) => gr.id === id);
  if (!g) return "#8b949e";
  return resolveGroupColor(g, groups);
}

export function groupColorBySlug(slug: string, groups: ModuleGroupRecord[]): string {
  if (SLUG_COLOR[slug]) return SLUG_COLOR[slug];
  const g = groups.find((gr) => gr.slug === slug);
  if (!g) return "#8b949e";
  return resolveGroupColor(g, groups);
}

export const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  admin:  { label: "Admin",  color: "#722ed1", bg: "rgba(114,46,209,.15)" },
  doctor: { label: "Bác sĩ", color: "#1677ff", bg: "rgba(22,119,255,.15)" },
  nurse:  { label: "Y tá",   color: "#0ca678", bg: "rgba(12,166,120,.15)" },
};
