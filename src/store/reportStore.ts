import { create } from "zustand";
import type { MenuSummary } from "@/types/report";
import { getAdminToken } from "@/infrastructure/http/httpForProvider";

export interface ReportMenuNode extends MenuSummary {
  children: ReportMenuNode[];
}

function buildTree(flat: MenuSummary[]): ReportMenuNode[] {
  const sorted = flat.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const map = new Map<string, ReportMenuNode>();
  for (const m of sorted) map.set(m.id, { ...m, children: [] });

  const roots: ReportMenuNode[] = [];
  for (const node of map.values()) {
    if (!node.parentId) {
      roots.push(node);
    } else {
      map.get(node.parentId)?.children.push(node);
    }
  }
  return roots;
}

interface ReportStore {
  menus:   ReportMenuNode[];
  loading: boolean;
  fetch:   () => Promise<void>;
}

export const useReportStore = create<ReportStore>((set) => ({
  menus:   [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const token = await getAdminToken();
      const res = await fetch("/api/reports", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const flat = (await res.json()) as MenuSummary[];
      set({ menus: buildTree(Array.isArray(flat) ? flat : []) });
    } finally {
      set({ loading: false });
    }
  },
}));
