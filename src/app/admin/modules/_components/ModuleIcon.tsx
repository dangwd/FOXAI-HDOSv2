"use client";

import { ICON_REGISTRY } from "../_lib/icons";

export function ModuleIcon({
  icon,
  groupColor = "#8b949e",
  iconSize = 16,
  boxSize = 36,
}: {
  icon: string;
  groupColor?: string;
  iconSize?: number;
  boxSize?: number;
}) {
  const LucideComp = ICON_REGISTRY[icon];
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
      style={{ background: groupColor, width: boxSize, height: boxSize, fontSize: boxSize < 36 ? 10 : 12 }}
    >
      {LucideComp ? <LucideComp size={iconSize} /> : (icon?.slice(0, 2) || "??")}
    </div>
  );
}
