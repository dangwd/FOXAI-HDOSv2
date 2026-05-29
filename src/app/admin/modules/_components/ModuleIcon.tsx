"use client";

import { ICON_REGISTRY } from "../_lib/icons";
import { ICON_BG } from "../_lib/constants";
import type { ModuleGroup } from "@/infrastructure/http/adminApi";

export function ModuleIcon({
  icon,
  group,
  iconSize = 16,
  boxSize = 36,
}: {
  icon: string;
  group?: ModuleGroup;
  iconSize?: number;
  boxSize?: number;
}) {
  const bg = ICON_BG[group ?? "dieu-hanh"] ?? "#8b949e";
  const LucideComp = ICON_REGISTRY[icon];
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
      style={{ background: bg, width: boxSize, height: boxSize, fontSize: boxSize < 36 ? 10 : 12 }}
    >
      {LucideComp ? <LucideComp size={iconSize} /> : (icon?.slice(0, 2) || "??")}
    </div>
  );
}
