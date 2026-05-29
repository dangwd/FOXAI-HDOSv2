import type { ModuleGroup } from "@/infrastructure/http/adminApi";

export const GROUP_META: Record<ModuleGroup, { label: string; color: string; bg: string; desc: string }> = {
  "dieu-hanh": { label: "Điều hành", color: "#1677ff", bg: "rgba(22,119,255,.12)", desc: "Dashboard, báo cáo vận hành" },
  "lam-sang":  { label: "Lâm sàng",  color: "#0ca678", bg: "rgba(12,166,120,.12)", desc: "Bệnh nhân, lâm sàng, ICU"   },
  "quan-tri":  { label: "Quản trị",  color: "#722ed1", bg: "rgba(114,46,209,.12)", desc: "Cấu hình hệ thống, quyền"   },
};

export const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  admin:  { label: "Admin",  color: "#722ed1", bg: "rgba(114,46,209,.15)" },
  doctor: { label: "Bác sĩ", color: "#1677ff", bg: "rgba(22,119,255,.15)" },
  nurse:  { label: "Y tá",   color: "#0ca678", bg: "rgba(12,166,120,.15)" },
};

export const ICON_BG: Record<string, string> = {
  "dieu-hanh": "#1677ff",
  "lam-sang":  "#0ca678",
  "quan-tri":  "#722ed1",
};

export const GROUP_ORDER: ModuleGroup[] = ["dieu-hanh", "lam-sang", "quan-tri"];
