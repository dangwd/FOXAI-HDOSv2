"use client";

import httpClient from "@/infrastructure/http/httpClient";
import type { DataSource } from "@/infrastructure/http/adminApi";
import { Input } from "antd";
import { Database, GripVertical, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/app/admin/datasources/_lib/types";
import type { SourceProfile } from "@/app/admin/datasources/_lib/types";

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Aggregate mode (default): fetch all records for this recordType — no patient filter.
 * requiredParams = [] so the datasource always fetches regardless of URL params.
 *
 * For patient-specific lookup, the admin can manually add
 *   &field=<businessKeyField>&value={<businessKeyField>}
 * to the resourcePath and set requiredParams accordingly.
 */
export function profileToDataSource(p: SourceProfile): DataSource {
  return {
    namespace:      p.recordType,
    serviceId:      "datamatch",
    resourcePath:   `/dm/records?sourceSystem=${p.sourceSystem}&recordType=${p.recordType}`,
    requiredParams: [],
    schemaPath:     `/dm/sources/${p.sourceSystem}/${p.recordType}/schema`,
  };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CatalogCard({
  profile,
  added,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  profile:     SourceProfile;
  added:       boolean;
  onAdd:       () => void;
  onDragStart: () => void;
  onDragEnd:   () => void;
}) {
  return (
    <div
      draggable
      unselectable="on"
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/datasource+json",
          JSON.stringify(profileToDataSource(profile)),
        );
        e.dataTransfer.effectAllowed = "copy";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg
        cursor-grab active:cursor-grabbing transition-all select-none
        hover:bg-gray-50 dark:hover:bg-[#161b22]
        ${added ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""}`}
    >
      {/* Left accent on hover */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-500
        opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Icon */}
      <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
        bg-emerald-50 dark:bg-emerald-950/30">
        <Database size={13} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3] m-0 truncate leading-tight">
          {profile.displayName}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 font-mono truncate mt-0.5">
          {profile.recordType}
        </p>
      </div>

      {/* Added badge */}
      {added && (
        <span className="shrink-0 text-[9px] font-bold text-emerald-600 dark:text-emerald-400
          bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
          ✓
        </span>
      )}

      {/* Add button — always show on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        title="Thêm vào màn hình"
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-base
          text-gray-300 dark:text-[#30363d]
          opacity-0 group-hover:opacity-100
          hover:text-emerald-600 dark:hover:text-emerald-400
          hover:bg-emerald-50 dark:hover:bg-emerald-950/30
          transition-all leading-none"
      >
        +
      </button>

      <GripVertical
        size={11}
        className="shrink-0 text-gray-300 dark:text-[#30363d]
          opacity-0 group-hover:opacity-50 transition-opacity"
      />
    </div>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export function SourceProfileCatalog({
  addedNamespaces,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  addedNamespaces: Set<string>;
  onAdd:           (ds: DataSource) => void;
  onDragStart:     () => void;
  onDragEnd:       () => void;
}) {
  const [profiles, setProfiles] = useState<SourceProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");

  useEffect(() => {
    httpClient
      .get<{ success: boolean; data: SourceProfile[] }>(`${API_BASE}/dm/sources`)
      .then((res) => setProfiles(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.recordType.toLowerCase().includes(q) ||
        p.sourceSystem.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const groups = useMemo(() => {
    const map = new Map<string, SourceProfile[]>();
    for (const p of filtered) {
      const k = p.sourceSystem;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return [...map.entries()];
  }, [filtered]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12
        text-gray-400 dark:text-[#484f58]">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs">Đang tải...</span>
      </div>
    );
  }

  // ── Empty catalog ─────────────────────────────────────────────────────────────

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1f2937] flex items-center justify-center">
          <Database size={18} className="text-gray-300 dark:text-[#30363d]" />
        </div>
        <p className="text-xs text-gray-500 dark:text-[#8b949e] m-0">
          Chưa có Source Profile nào
        </p>
        <a
          href="/admin/datasources"
          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Tạo trong Data Matching Sources →
        </a>
      </div>
    );
  }

  // ── Catalog ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Search */}
      <div className="px-2.5 pt-2 pb-1.5 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
        <Input
          size="small"
          prefix={<Search size={12} className="text-gray-400" />}
          placeholder="Tìm nguồn dữ liệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {/* No match */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10
          text-gray-400 dark:text-[#484f58]">
          <Search size={16} className="text-gray-200 dark:text-[#30363d]" />
          <p className="text-xs m-0">Không tìm thấy</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1.5">
          <div className="px-1.5 space-y-3 pt-1">
            {groups.map(([system, items]) => (
              <div key={system}>
                {/* Group header */}
                <div className="px-2 pb-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider
                    text-gray-400 dark:text-[#484f58] font-mono">
                    {system}
                  </span>
                  <span className="text-[10px] text-gray-300 dark:text-[#30363d]">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-0.5">
                  {items.map((p) => (
                    <CatalogCard
                      key={p.id}
                      profile={p}
                      added={addedNamespaces.has(p.recordType)}
                      onAdd={() => onAdd(profileToDataSource(p))}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hint */}
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] text-gray-300 dark:text-[#30363d] m-0 text-center">
              Click + hoặc kéo thả để thêm
            </p>
          </div>
        </div>
      )}
    </>
  );
}
