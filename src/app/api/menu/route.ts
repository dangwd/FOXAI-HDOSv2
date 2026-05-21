import { NextResponse } from "next/server";

/** GET /api/menu — chỉ trả navigation, không chứa screen config */
export async function GET() {
  return NextResponse.json({
    groups: [
      {
        id: "overview",
        label: "TỔNG QUAN",
        items: [
          { id: "dashboard",          label: "Executive Dashboard",   icon: "dashboard" },
          { id: "bao-cao-truc-quan",  label: "Báo cáo trực quan",     icon: "report",    badge: { type: "new" } },
        ],
      },
      {
        id: "clinical",
        label: "NHÓM LÂM SÀNG",
        items: [
          { id: "patient-exam", label: "Khám chữa bệnh",           icon: "stethoscope" },
          { id: "inpatient",    label: "Giường & Nội trú",          icon: "bed",         badge: { type: "tag", value: "ICU" } },
          { id: "cdha",         label: "Cận lâm sàng (XN+CĐHA)",   icon: "flask",       badge: { type: "tag", value: "LS" } },
          { id: "surgery",      label: "Phẫu thuật & Gây mê",       icon: "scalpel" },
          { id: "cdss",         label: "AI Lâm sàng (CDSS)",        icon: "brain",       badge: { type: "new" } },
        ],
      },
      {
        id: "admin",
        label: "NHÓM QUẢN TRỊ",
        items: [
          { id: "finance",  label: "Tài chính (RCM+DRG)",  icon: "chart" },
          { id: "supply",   label: "Chuỗi cung ứng",        icon: "package", badge: { type: "count", value: 3 } },
          { id: "quality",  label: "Chất lượng & ATBT",     icon: "shield",  badge: { type: "new" } },
        ],
      },
      {
        id: "external",
        label: "NHÓM NGOẠI VIỆN & UX",
        items: [
          { id: "patient-journey", label: "Patient Journey",       icon: "journey" },
          { id: "ecosystem",       label: "Ecosystem Integration", icon: "network" },
        ],
      },
      {
        id: "strategy",
        label: "NHÓM CHIẾN LƯỢC",
        items: [
          { id: "executive-kpi",  label: "Executive KPI",           icon: "target" },
          { id: "ai-chatbot",     label: "AI Chatbot & Voice",      icon: "chat" },
          { id: "hr-credential",  label: "Nhân sự & Credentialing", icon: "people" },
          { id: "incident",       label: "Runbook & Incident",      icon: "alert",  badge: { type: "count", value: 7 } },
        ],
      },
      {
        id: "international",
        label: "ĐẲNG CẤP QUỐC TẾ",
        items: [
          { id: "digital-twin",       label: "Digital Twin",        icon: "layers",  badge: { type: "new" } },
          { id: "clinical-path",      label: "Clinical Pathway",    icon: "path",    badge: { type: "new" } },
          { id: "population-health",  label: "Population Health",   icon: "globe",   badge: { type: "new" } },
          { id: "research",           label: "Research Platform",   icon: "research",badge: { type: "new" } },
          { id: "multi-hospital",     label: "Multi-Hospital",      icon: "hospital",badge: { type: "new" } },
        ],
      },
    ],
  });
}
