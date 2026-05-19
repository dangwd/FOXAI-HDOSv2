import { NextResponse } from "next/server";

/** GET /api/menu — chỉ trả navigation, không chứa screen config */
export async function GET() {
  return NextResponse.json({
    groups: [
      {
        id: "overview",
        label: "TỔNG QUAN",
        items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard" }],
      },
      {
        id: "clinical",
        label: "NHÓM LÂM SÀNG",
        items: [
          { id: "patient-exam", label: "Khám chữa bệnh", icon: "stethoscope" },
          {
            id: "inpatient",
            label: "Giường & Nội trú",
            icon: "bed",
            badge: { type: "tag", value: "ICU" },
          },
          { id: "cdss", label: "AI Lâm sàng CDSS", icon: "brain" },
        ],
      },
      {
        id: "admin",
        label: "NHÓM QUẢN TRỊ",
        items: [
          { id: "finance", label: "Tài chính RCM+DRG", icon: "chart" },
          {
            id: "supply",
            label: "Chuỗi cung ứng",
            icon: "package",
            badge: { type: "count", value: 3 },
          },
          {
            id: "incident",
            label: "Runbook & Incident",
            icon: "alert",
            badge: { type: "count", value: 7 },
          },
        ],
      },
      {
        id: "external",
        label: "NHÓM NGOẠI VIỆN & UX",
        items: [
          {
            id: "ambulance",
            label: "Xe cấp cứu 115",
            icon: "ambulance",
            badge: { type: "live" },
          },
        ],
      },
      {
        id: "international",
        label: "ĐẲNG CẤP QUỐC TẾ",
        items: [
          {
            id: "digital-twin",
            label: "Digital Twin",
            icon: "layers",
            badge: { type: "new" },
          },
          {
            id: "clinical-path",
            label: "Clinical Pathway",
            icon: "path",
            badge: { type: "new" },
          },
        ],
      },
    ],
  });
}
