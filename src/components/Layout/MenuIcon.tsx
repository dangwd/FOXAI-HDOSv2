'use client';
import { ICON_REGISTRY } from "@/shared/icons";
import { LayoutDashboard } from "lucide-react";

export default function MenuIcon({ name, size = 15 }: { name: string; size?: number }) {
  const Icon = ICON_REGISTRY[name] ?? LayoutDashboard;
  return <Icon size={size} />;
}
