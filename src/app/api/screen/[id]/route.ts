import type { ScreenConfig } from "@/types/screen";
import { NextResponse } from "next/server";

/**
 * GET /api/screen/:id
 * Backend định nghĩa màn hình: phần nào hiển thị, dữ liệu gì.
 * FE chỉ render theo — không biết gì về nội dung.
 */
const SCREENS: Record<string, ScreenConfig> = {
  dashboard: {
    title: "Executive Dashboard",
    badge: "HDOS v1.0",
    live: true,
    subtitle: "Tổng quan điều hành toàn viện · Cập nhật realtime",
    actions: [
      { label: "↺ Làm mới", variant: "default" },
      { label: "Báo cáo giao ban", variant: "default" },
      { label: "Hỏi AI", variant: "primary", color: "#1677ff" },
    ],
    rows: [
      // Row 1: 5 KPI cards — live via SSE
      {
        components: [
          {
            type: "KpiCard",
            sse: { url: "/api/sse/dashboard", event: "kpi-visits" },
            props: {
              title: "LƯỢT KHÁM HÔM NAY",
              value: 151,
              accent: "#1677ff",
              hint: "+42% hôm qua",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            sse: { url: "/api/sse/dashboard", event: "kpi-revenue" },
            props: {
              title: "DOANH THU",
              value: "4.23 tỷ",
              accent: "#52c41a",
              hint: "+8% so kế hoạch",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            sse: { url: "/api/sse/dashboard", event: "kpi-inpatient" },
            props: {
              title: "BN NỘI TRÚ",
              value: 312,
              accent: "#722ed1",
              hint: "+14 so sáng nay",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            sse: { url: "/api/sse/dashboard", event: "kpi-bor" },
            props: {
              title: "BOB TOÀN VIỆN",
              value: "78.4%",
              accent: "#fa8c16",
              hint: "+2.1%",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            sse: { url: "/api/sse/dashboard", event: "kpi-alerts" },
            props: {
              title: "CẢNH BÁO ACTIVE",
              value: 8,
              accent: "#ff4d4f",
              hint: "8 cần xử lý ngay",
              hintColor: "#ff4d4f",
            },
          },
        ],
      },
      // Row 2: ProgressList (span 16) + AlertList (span 8)
      {
        components: [
          {
            type: "ProgressList",
            span: 16,
            sse: { url: "/api/sse/dashboard", event: "chart-beds" },
            props: {
              title: "Công suất giường theo khoa",
              headerAction: "Xem chi tiết →",
              maxValue: 100,
              items: [
                {
                  label: "ICU",
                  value: 80,
                  secondaryValue: 90,
                  color: "#ff4d4f",
                },
                {
                  label: "Khoa Nội tim mạch",
                  value: 84,
                  secondaryValue: 90,
                  color: "#faad14",
                },
                {
                  label: "Khoa Nội tổng quát (ICU)",
                  value: 90,
                  secondaryValue: 95,
                  color: "#ff4d4f",
                },
                {
                  label: "Ung bướu",
                  value: 87,
                  secondaryValue: 90,
                  color: "#faad14",
                },
                {
                  label: "Khoa Tim mạch can thiệp",
                  value: 78,
                  secondaryValue: 85,
                  color: "#52c41a",
                },
                {
                  label: "Khoa Nội tổng quát",
                  value: 72,
                  secondaryValue: 80,
                  color: "#52c41a",
                },
                {
                  label: "Khoa Ngoại tổng quát",
                  value: 61,
                  secondaryValue: 75,
                  color: "#52c41a",
                },
                {
                  label: "Khoa Nhi",
                  value: 54,
                  secondaryValue: 70,
                  color: "#52c41a",
                },
                {
                  label: "Khoa Thần kinh",
                  value: 62,
                  secondaryValue: 75,
                  color: "#52c41a",
                },
                {
                  label: "Khoa Sản khoa",
                  value: 53,
                  secondaryValue: 70,
                  color: "#52c41a",
                },
                {
                  label: "Khoa Hồi lưu",
                  value: 49,
                  secondaryValue: 65,
                  color: "#52c41a",
                },
              ],
              footerActions: [
                { label: "18 khoa · Xem chi tiết →", variant: "link" },
              ],
            },
          },
          {
            type: "AlertList",
            span: 8,
            sse: { url: "/api/sse/dashboard", event: "chart-alerts" },
            props: {
              title: "Cảnh báo đang kích hoạt",
              realtimeBadge: true,
              totalCount: 8,
              items: [
                {
                  code: "1.3",
                  text: "Troponin I > 12.4 ng/mL",
                  patient: "BN: Nguyễn Văn A",
                  dept: "Khoa Nội tim mạch",
                  time: "3 phút trước",
                  severity: "critical",
                },
                {
                  code: "Kx",
                  text: "Kx > 2.2 mmol/L",
                  patient: "BN: Trần Thị B",
                  dept: "Khoa Cấp cứu",
                  time: "5 phút trước",
                  severity: "critical",
                },
                {
                  code: "Na+",
                  text: "Na+ > 118 mmol/L",
                  patient: "BN: Lê Văn C",
                  dept: "Khoa Nội tổng quát",
                  time: "8 phút trước",
                  severity: "warning",
                },
                {
                  code: "PTx",
                  text: "PTx > 22%",
                  patient: "BN: Phạm Thị D",
                  dept: "Khoa Huyết học",
                  time: "16 phút trước",
                  severity: "warning",
                },
                {
                  code: "NH3",
                  text: "NH3 > 185 μmol/L",
                  patient: "BN: Hoàng Văn E",
                  dept: "Khoa Gan mật",
                  time: "24 phút trước",
                  severity: "warning",
                },
              ],
            },
          },
        ],
      },
      // Row 3: FlowPipeline (span 16) + ChartPie (span 8)
      {
        components: [
          {
            type: "FlowPipeline",
            span: 16,
            sse: { url: "/api/sse/dashboard", event: "chart-flow" },
            props: {
              title: "Dòng bệnh nhân hôm nay",
              footer: "T/BT: 38 phút · Tracking từ đăng ký đến hoàn thành",
              stages: [
                { label: "Tổng lịch", value: 148, color: "#1677ff" },
                { label: "Chờ khám", value: 46, color: "#faad14" },
                { label: "Đang nội trú", value: 79, color: "#722ed1" },
                { label: "Hoàn thành", value: 0, color: "#52c41a" },
              ],
            },
          },
          {
            type: "ChartPie",
            span: 8,
            sse: { url: "/api/sse/dashboard", event: "chart-revenue-pie" },
            props: {
              title: "Phân loại doanh thu",
              height: 220,
              variant: "donut",
              legend: true,
              data: [
                { label: "BHYT", value: 58 },
                { label: "Viện phí", value: 27 },
                { label: "Dịch vụ", value: 12 },
                { label: "BH Khác", value: 3 },
              ],
              colors: ["#1677ff", "#fa8c16", "#52c41a", "#8b949e"],
            },
          },
        ],
      },
    ],
  },

  "patient-exam": {
    title: "M01 - Điều hành Khám chữa bệnh",
    badge: "BETA",
    subtitle: "Đồng bộ realtime · Triage · Điều phối phòng khám",
    actions: [
      { label: "+ Điều phối phòng khám", variant: "primary" },
      { label: "Trao điều cứu", variant: "default" },
    ],
    rows: [
      // Hàng 1: KPI
      {
        components: [
          {
            type: "KpiCard",
            props: {
              title: "Tổng lượt khám",
              value: 3,
              accent: "#1677ff",
              hint: "+4 so với hôm qua",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "Chờ khám TA",
              value: 0,
              accent: "#ff4d4f",
              hint: "0 / Chưa Triage",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "Chờ MÁC",
              value: 0,
              accent: "#faad14",
              hint: "0 Nothing",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "Triage P1 / P2 / P3",
              value: "0 / 0 / 0",
              accent: "#722ed1",
              hint: "0 Chờ theo dõi",
              hintColor: "#8b949e",
            },
          },
        ],
      },
      // Hàng 2: Top phòng khám + Dự báo AI
      {
        components: [
          {
            type: "ProgressList",
            span: 14,
            props: {
              title: "Tốp theo phòng khám",
              maxValue: 60,
              items: [
                {
                  label: "Nội Th-01",
                  value: 22,
                  secondaryValue: 45,
                  color: "#52c41a",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Nội Th-02",
                  value: 19,
                  secondaryValue: 40,
                  color: "#52c41a",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Nội Th-03",
                  value: 44,
                  secondaryValue: 55,
                  color: "#ff4d4f",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Ngoại-01",
                  value: 31,
                  secondaryValue: 48,
                  color: "#faad14",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Nội-02",
                  value: 25,
                  secondaryValue: 42,
                  color: "#52c41a",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Răng-01",
                  value: 12,
                  secondaryValue: 30,
                  color: "#52c41a",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Mắt-01",
                  value: 18,
                  secondaryValue: 35,
                  color: "#52c41a",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Phụ khoa-01",
                  value: 29,
                  secondaryValue: 45,
                  color: "#faad14",
                  secondaryColor: "#faad14",
                },
                {
                  label: "Tim mạch-01",
                  value: 35,
                  secondaryValue: 50,
                  color: "#faad14",
                  secondaryColor: "#faad14",
                },
              ],
            },
          },
          {
            type: "ChartArea",
            span: 10,
            props: {
              title: "Dự báo AI — 4 giờ tới",
              height: 300,
              legend: true,
              series: [
                { key: "aiDuBao", color: "#1677ff", name: "AI dự báo" },
                { key: "thucTe", color: "#52c41a", name: "Thực tế" },
                { key: "caoDiem", color: "#ff4d4f", name: "Cao điểm 10h" },
              ],
              data: [
                { label: "08h", aiDuBao: 47, thucTe: 43, caoDiem: 60 },
                { label: "09h", aiDuBao: 53, thucTe: 55, caoDiem: 70 },
                { label: "10h", aiDuBao: 69, thucTe: 65, caoDiem: 80 },
                { label: "11h", aiDuBao: 43, thucTe: 48, caoDiem: 70 },
                { label: "12h", aiDuBao: 137, caoDiem: 100 },
                { label: "13h", aiDuBao: 138, caoDiem: 100 },
                { label: "14h", aiDuBao: 132, caoDiem: 100 },
                { label: "15h", aiDuBao: 97, caoDiem: 100 },
              ],
            },
          },
        ],
      },
      // Hàng 3: Dòng chảy bệnh nhân
      {
        components: [
          {
            type: "FlowPipeline",
            span: 24,
            props: {
              title: "Dòng chảy bệnh nhân hôm nay",
              footer:
                "Cập nhật mỗi 5 phút · Đã Th 6 phút · Trung bình kỳ đến tặc thành tuần",
              stages: [
                { label: "Đăng ký", value: 3, color: "#1677ff" },
                { label: "Chờ khám", value: 0, color: "#faad14" },
                { label: "Đang khám", value: 0, color: "#1677ff" },
                { label: "Chờ CLS", value: 0, color: "#722ed1" },
                { label: "Nhận kết", value: 0, color: "#13c2c2" },
                { label: "Kê đơn/KV", value: 0, color: "#52c41a" },
                { label: "Hoàn thành", value: 0, color: "#52c41a" },
              ],
            },
          },
        ],
      },
      // Hàng 4: Danh sách ca đang xử lý
      {
        components: [
          {
            type: "DataTable",
            span: 24,
            props: {
              columns: [
                { key: "ma", title: "Mã" },
                { key: "benhNhan", title: "Bệnh nhân" },
                {
                  key: "triage",
                  title: "Triage",
                  render: "tag",
                  tagColors: { P1: "red", P2: "orange", P3: "blue" },
                },
                { key: "cho", title: "Chờ" },
                { key: "bs", title: "BS" },
                {
                  key: "trangThai",
                  title: "Trạng thái",
                  render: "tag",
                  tagColors: {
                    "Chưa phân công": "orange",
                    "Đang xử lý": "green",
                  },
                },
                {
                  key: "hanhDong",
                  title: "Hành động",
                  render: "button",
                  buttonColor: "#1677ff",
                },
              ],
              data: [
                {
                  ma: "CU-B01",
                  benhNhan: "Nguyễn Văn An",
                  triage: "P1",
                  cho: "7 phút",
                  bs: "—",
                  trangThai: "Chưa phân công",
                  hanhDong: "Update",
                },
                {
                  ma: "CU-B02",
                  benhNhan: "Trần Thị B",
                  triage: "P1",
                  cho: "3 phút",
                  bs: "Bs. Bình",
                  trangThai: "Đang xử lý",
                  hanhDong: "Update",
                },
                {
                  ma: "CU-B03",
                  benhNhan: "Lê Văn C",
                  triage: "P2",
                  cho: "16 phút",
                  bs: "Bs. Đức",
                  trangThai: "Đang xử lý",
                  hanhDong: "Update",
                },
                {
                  ma: "CU-B04",
                  benhNhan: "Phạm Thị D",
                  triage: "P2",
                  cho: "11 phút",
                  bs: "—",
                  trangThai: "Chưa phân công",
                  hanhDong: "Update",
                },
                {
                  ma: "CU-B05",
                  benhNhan: "Hoàng Văn E",
                  triage: "P3",
                  cho: "5 phút",
                  bs: "BS. Giang",
                  trangThai: "Đang xử lý",
                  hanhDong: "Update",
                },
              ],
            },
          },
        ],
      },
    ],
  },

  finance: {
    title: "M06 · Tài chính (RCM + DRG)",
    badge: "Tài chính Kế toán",
    badgeColor: "#52c41a",
    subtitle: "Revenue Cycle Management 10 bước · DRG Costing · Profitability Analysis",
    actions: [
      { label: "Báo cáo giao ban", variant: "default" },
      { label: "RPA BHYT", variant: "primary", color: "#cf1322" },
    ],
    tabs: [
      // ── Tab 1: Doanh thu Realtime ─────────────────────────────────────────
      {
        id: "realtime",
        label: "📊 Doanh thu Realtime",
        rows: [
          {
            components: [
              {
                type: "KpiCard",
                props: {
                  title: "DOANH THU HÔM NAY",
                  value: "0.00 tỷ",
                  accent: "#1677ff",
                  hint: "0% KH ngày",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "DOANH THU THÁNG 4",
                  value: "0.2 tỷ",
                  accent: "#52c41a",
                  hint: "0.5% KH",
                  hintColor: "#faad14",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "SAI LỆCH RPA PHÁT HIỆN",
                  value: "18 tr",
                  accent: "#ff4d4f",
                  hint: "Khoa Nội-01 1.2%",
                  hintColor: "#ff4d4f",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "ĐỐI SOÁT BHYT TỰ ĐỘNG",
                  value: "91.2%",
                  accent: "#52c41a",
                  hint: "↑ 2.1%",
                  hintColor: "#52c41a",
                },
              },
            ],
          },
          {
            components: [
              {
                type: "ChartArea",
                span: 14,
                props: {
                  title: "📊 Doanh thu theo giờ hôm nay",
                  height: 220,
                  legend: true,
                  series: [
                    { key: "thucTe",  color: "#1677ff", name: "Thực tế" },
                    { key: "keHoach", color: "#52c41a", name: "Kế hoạch" },
                  ],
                  data: [
                    { label: "6h",  thucTe: 0,    keHoach: 0.35 },
                    { label: "7h",  thucTe: 0.02, keHoach: 0.35 },
                    { label: "8h",  thucTe: 0,    keHoach: 0.35 },
                    { label: "9h",  thucTe: 0,    keHoach: 0.35 },
                    { label: "10h", thucTe: 0,    keHoach: 0.35 },
                    { label: "11h", thucTe: 0,    keHoach: 0.35 },
                    { label: "12h", thucTe: 0,    keHoach: 0.35 },
                  ],
                  unit: "tỷ",
                },
              },
              {
                type: "ProgressList",
                span: 10,
                props: {
                  title: "💰 Phân loại doanh thu",
                  maxValue: 100,
                  items: [
                    { label: "BHYT",       value: 0,  color: "#1677ff" },
                    { label: "Viện phí",   value: 0,  color: "#52c41a" },
                    { label: "Dịch vụ",    value: 0,  color: "#722ed1" },
                    { label: "BH tư nhân", value: 0,  color: "#fa8c16" },
                  ],
                  footerActions: [
                    { label: "0% KH tháng · Cập nhật realtime từ HIS", variant: "link" },
                  ],
                },
              },
            ],
          },
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "🔴 Cảnh báo sai lệch chỉ định/thanh toán — RPA quét 100% hồ sơ",
                  type: "error",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "nguon",     title: "Nguồn" },
                    { key: "moTa",      title: "Mô tả" },
                    { key: "soTien",    title: "Số tiền" },
                    { key: "phatHien",  title: "Phát hiện" },
                    {
                      key: "action",
                      title: "Action",
                      render: "button",
                      buttonColor: "#1677ff",
                    },
                  ],
                  data: [
                    {
                      nguon:      "Khoa Nội-01",
                      moTa:       "Chỉ định vs thanh toán lệch 1.2%",
                      soTien:     "12.5 triệu",
                      phatHien:   "RPA 09:45",
                      action:     "Xem",
                    },
                    {
                      nguon:      "BN26000398",
                      moTa:       "Tạm ứng còn 8% — cần nạp",
                      soTien:     "2.1 triệu",
                      phatHien:   "Trước XV",
                      action:     "Liên hệ BN",
                    },
                    {
                      nguon:      "BHYT-0441",
                      moTa:       "Sai mã ICD J18.9 → J22",
                      soTien:     "3.8 triệu",
                      phatHien:   "RPA 08:20",
                      action:     "Sửa mã",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      // ── Tab 2: Revenue Cycle ──────────────────────────────────────────────
      {
        id: "revenue-cycle",
        label: "📈 Revenue Cycle",
        rows: [
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "📋 Revenue Cycle Management — 10 bước (tháng 4/2026)",
                  type: "info",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "KpiCard",
                props: {
                  title: "CLEAN CLAIM RATE",
                  value: "100%",
                  accent: "#52c41a",
                  hint: "Mục tiêu ≥95%",
                  hintColor: "#52c41a",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "DENIAL RATE",
                  value: "0%",
                  accent: "#52c41a",
                  hint: "<5%",
                  hintColor: "#52c41a",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "DAYS IN A/R",
                  value: 0,
                  accent: "#1677ff",
                  hint: "<45 ngày",
                  hintColor: "#52c41a",
                },
              },
            ],
          },
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "📋 Hồ sơ BHYT đang xử lý",
                  type: "info",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "hoSo",    title: "Hồ sơ" },
                    { key: "bn",      title: "BN" },
                    { key: "dichVu",  title: "Dịch vụ" },
                    { key: "soTien",  title: "Số tiền" },
                    {
                      key: "ketQua",
                      title: "Kết quả",
                      render: "tag",
                      tagColors: {
                        "OK":       "green",
                        "Lỗi":     "red",
                        "Từ chối": "red",
                      },
                    },
                    { key: "lyDo",   title: "Lý do" },
                    {
                      key: "action",
                      title: "Action",
                      render: "button",
                      buttonColor: "#1677ff",
                    },
                  ],
                  data: [
                    {
                      hoSo:    "BHYT-26-0841",
                      bn:      "Nguyễn Văn An",
                      dichVu:  "ICU ngày",
                      soTien:  "8.5 tr",
                      ketQua:  "OK",
                      lyDo:    "—",
                      action:  "Nộp",
                    },
                    {
                      hoSo:    "BHYT-26-0840",
                      bn:      "Trần Thị B",
                      dichVu:  "Phẫu thuật",
                      soTien:  "25.0 tr",
                      ketQua:  "Lỗi",
                      lyDo:    "Sai ICD",
                      action:  "Sửa",
                    },
                    {
                      hoSo:    "BHYT-26-0837",
                      bn:      "Hoàng V.E",
                      dichVu:  "Siêu âm tim",
                      soTien:  "1.8 tr",
                      ketQua:  "Từ chối",
                      lyDo:    "Sai khoa",
                      action:  "Re-submit",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      // ── Tab 3: DRG Costing ────────────────────────────────────────────────
      {
        id: "drg-costing",
        label: "💊 DRG Costing",
        rows: [
          {
            components: [
              {
                type: "KpiCard",
                props: {
                  title: "TỔNG DRG GROUPS",
                  value: 482,
                  accent: "#1677ff",
                  hint: "Phân loại tự động",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "CASE MIX INDEX",
                  value: 0,
                  accent: "#722ed1",
                  hint: "Hạng I chuẩn 1.2+",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "DRG LỖ (THÁNG)",
                  value: 0,
                  accent: "#faad14",
                  hint: "Cần điều chỉnh",
                  hintColor: "#faad14",
                },
              },
            ],
          },
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "🏷 Top DRG theo khối lượng & margin",
                  type: "info",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "drgCode",    title: "DRG Code" },
                    { key: "tenNhom",    title: "Tên nhóm bệnh" },
                    { key: "caThang",    title: "Ca/tháng" },
                    { key: "chiPhiTb",   title: "Chi phí TB" },
                    { key: "dinhMuc",    title: "Định mức BYT" },
                    {
                      key: "margin",
                      title: "Margin",
                      render: "tag",
                      tagColors: {
                        "+6.2%":  "green",
                        "+9.0%":  "green",
                        "+7.5%":  "green",
                        "+5.1%":  "green",
                        "-13.6%": "red",
                      },
                    },
                    { key: "cmiWeight",  title: "CMI Weight" },
                  ],
                  data: [
                    {
                      drgCode:   "DRG-470",
                      tenNhom:   "Thay khớp háng toàn phần",
                      caThang:   12,
                      chiPhiTb:  "45.2 tr",
                      dinhMuc:   "48.0 tr",
                      margin:    "+6.2%",
                      cmiWeight: "3.24",
                    },
                    {
                      drgCode:   "DRG-066",
                      tenNhom:   "Đột quỵ não có can thiệp",
                      caThang:   22,
                      chiPhiTb:  "32.1 tr",
                      dinhMuc:   "35.0 tr",
                      margin:    "+9.0%",
                      cmiWeight: "2.47",
                    },
                    {
                      drgCode:   "DRG-291",
                      tenNhom:   "Suy tim nặng có MCC",
                      caThang:   8,
                      chiPhiTb:  "28.4 tr",
                      dinhMuc:   "25.0 tr",
                      margin:    "-13.6%",
                      cmiWeight: "2.18",
                    },
                    {
                      drgCode:   "DRG-193",
                      tenNhom:   "Bệnh phổi nặng có MCC",
                      caThang:   15,
                      chiPhiTb:  "18.6 tr",
                      dinhMuc:   "20.0 tr",
                      margin:    "+7.5%",
                      cmiWeight: "1.86",
                    },
                    {
                      drgCode:   "DRG-310",
                      tenNhom:   "Tim mạch can thiệp PCI",
                      caThang:   18,
                      chiPhiTb:  "52.3 tr",
                      dinhMuc:   "55.0 tr",
                      margin:    "+5.1%",
                      cmiWeight: "4.12",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      // ── Tab 4: Profitability ──────────────────────────────────────────────
      {
        id: "profitability",
        label: "📊 Profitability",
        rows: [
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "💰 Profitability theo khoa",
                  type: "info",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "khoa",          title: "Khoa" },
                    { key: "doanhThuThang", title: "Doanh thu tháng" },
                    { key: "chiPhiTT",      title: "Chi phí TT" },
                    { key: "chiPhiGT",      title: "Chi phí GT" },
                    {
                      key: "margin",
                      title: "Margin",
                      render: "tag",
                      tagColors: {
                        "+18.4%": "green",
                        "+12.1%": "green",
                        "+9.6%":  "green",
                        "+7.2%":  "green",
                        "-4.3%":  "red",
                        "+22.7%": "green",
                      },
                    },
                    { key: "revBedDay",  title: "Revenue/Bed/Day" },
                    {
                      key: "xuHuong",
                      title: "Xu hướng",
                      render: "tag",
                      tagColors: {
                        "↑ Tăng":    "green",
                        "→ Ổn định": "blue",
                        "↓ Giảm":    "red",
                      },
                    },
                  ],
                  data: [
                    {
                      khoa:          "Tim mạch can thiệp",
                      doanhThuThang: "1.24 tỷ",
                      chiPhiTT:      "980 tr",
                      chiPhiGT:      "1.01 tỷ",
                      margin:        "+22.7%",
                      revBedDay:     "4.2 tr",
                      xuHuong:       "↑ Tăng",
                    },
                    {
                      khoa:          "ICU / Hồi sức",
                      doanhThuThang: "890 tr",
                      chiPhiTT:      "728 tr",
                      chiPhiGT:      "748 tr",
                      margin:        "+18.4%",
                      revBedDay:     "3.8 tr",
                      xuHuong:       "↑ Tăng",
                    },
                    {
                      khoa:          "Ngoại tổng quát",
                      doanhThuThang: "645 tr",
                      chiPhiTT:      "562 tr",
                      chiPhiGT:      "575 tr",
                      margin:        "+12.1%",
                      revBedDay:     "2.1 tr",
                      xuHuong:       "→ Ổn định",
                    },
                    {
                      khoa:          "Nội tổng quát",
                      doanhThuThang: "420 tr",
                      chiPhiTT:      "374 tr",
                      chiPhiGT:      "381 tr",
                      margin:        "+9.6%",
                      revBedDay:     "1.4 tr",
                      xuHuong:       "→ Ổn định",
                    },
                    {
                      khoa:          "Sản khoa",
                      doanhThuThang: "380 tr",
                      chiPhiTT:      "352 tr",
                      chiPhiGT:      "358 tr",
                      margin:        "+7.2%",
                      revBedDay:     "1.8 tr",
                      xuHuong:       "↑ Tăng",
                    },
                    {
                      khoa:          "Ung bướu",
                      doanhThuThang: "510 tr",
                      chiPhiTT:      "532 tr",
                      chiPhiGT:      "544 tr",
                      margin:        "-4.3%",
                      revBedDay:     "2.3 tr",
                      xuHuong:       "↓ Giảm",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },

  supply: {
    title: "Chuỗi cung ứng",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "3 vật tư cần đặt hàng ngay", type: "warning" },
          },
        ],
      },
      {
        components: [
          {
            type: "DataTable",
            span: 24,
            props: {
              columns: [
                { key: "id", title: "Mã vật tư" },
                { key: "name", title: "Tên" },
                { key: "stock", title: "Tồn kho" },
                { key: "unit", title: "Đơn vị" },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: "tag",
                  tagColors: { Đủ: "green", Thấp: "orange", Hết: "red" },
                },
              ],
              data: [
                {
                  id: "VT-001",
                  name: "Kim tiêm 23G",
                  stock: 2400,
                  unit: "Cái",
                  status: "Đủ",
                },
                {
                  id: "VT-002",
                  name: "Găng tay vô khuẩn",
                  stock: 150,
                  unit: "Đôi",
                  status: "Thấp",
                },
                {
                  id: "VT-003",
                  name: "Oxy y tế (bình)",
                  stock: 8,
                  unit: "Bình",
                  status: "Hết",
                },
              ],
            },
          },
        ],
      },
    ],
  },

  cdss: {
    title: "M05 · AI Lâm sàng",
    badge: "CDSS + Sepsis + Radiology AI + Voice EMR",
    badgeColor: "#722ed1",
    subtitle: "AI gợi ý — BS quyết định · Human-in-the-loop · Tuân thủ nghiêm ngặt",
    rows: [
      // Row 1: 5 KPIs
      {
        components: [
          {
            type: "KpiCard",
            props: {
              title: "CDSS COVERAGE ĐÓN",
              value: "96.2%",
              accent: "#52c41a",
              hint: "Mục tiêu 100%",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "NEWS2 COVERAGE BN",
              value: "98%",
              accent: "#1677ff",
              hint: "350 BN nội trú",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "SEPSIS ALERT 24H",
              value: 10,
              accent: "#ff4d4f",
              hint: "3 đã chuyển ICU",
              hintColor: "#ff4d4f",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "VOICE-TO-TEXT HÔM NAY",
              value: 0,
              accent: "#722ed1",
              hint: "Accuracy 96.4%",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "CDSS OVERRIDE RATE",
              value: "8.2%",
              accent: "#faad14",
              hint: "BS override có lý do",
              hintColor: "#8b949e",
            },
          },
        ],
      },
      // Row 2: CDSS panel + Sepsis Monitoring
      {
        components: [
          {
            type: "AlertBanner",
            span: 12,
            props: {
              message: "💊 CDSS tại điểm kê đơn — 5 lớp kiểm tra",
              description: "⚠ Cảnh báo dị ứng đang chờ xác nhận · Tương tác thuốc: 2 · Liều bất thường: 1",
              type: "warning",
              showIcon: false,
            },
          },
          {
            type: "AlertBanner",
            span: 12,
            props: {
              message: "·· Sepsis Alert Monitoring — NEWS2 Realtime",
              description: "Cập nhật mỗi 15 phút · 10 alert trong 24h · 3 ca đã chuyển ICU · Không có alert mới",
              type: "info",
              showIcon: false,
            },
          },
        ],
      },
      // Row 3: Voice EMR + Sepsis Bundle
      {
        components: [
          {
            type: "VoiceEMR",
            span: 12,
            props: {
              title: "🎙️ Voice-to-Text EMR",
              badge: "Giảm 60-70% thời gian",
              badgeColor: "#52c41a",
              description: [
                "AI nhận dạng tiếng Việt y khoa · Auto-SOAP structure",
                "Chief Complaint · History · Exam · Assessment · Plan",
              ],
              accuracy: "Độ chính xác ≥95% với thuật ngữ BYT 2024",
            },
          },
          {
            type: "ProgressList",
            span: 12,
            props: {
              title: "🏥 Sepsis Bundle 1h Compliance (tháng này)",
              maxValue: 100,
              items: [
                { label: "Lactate đo trong 1h",       value: 0,  color: "#ff4d4f" },
                { label: "Cấy máu trước kháng sinh",  value: 0,  color: "#ff4d4f" },
                { label: "Kháng sinh phổ rộng 1h",    value: 0,  color: "#ff4d4f" },
                { label: "Bolus dịch 30ml/kg",        value: 0,  color: "#ff4d4f" },
              ],
              footerActions: [
                { label: "Overall 1h bundle compliance: 0% · Mục tiêu ≥90%", variant: "link" },
              ],
            },
          },
        ],
      },
    ],
  },

  inpatient: {
    title: "M02 - Giường bệnh & Nội trú",
    badge: "BETA · BI",
    badgeColor: "#1677ff",
    subtitle: "Heatmap giường · ECR realtime · NDREZ Trends · ALOS",
    actions: [
      { label: "Giường dự phòng", variant: "default" },
      { label: "+ Nhập viện mới", variant: "primary" },
    ],
    rows: [
      {
        components: [
          {
            type: "KpiCard",
            props: {
              title: "BOR TOÀN VIỆN",
              value: "32 / 120",
              accent: "#fa8c16",
              hint: "15 đang tiếp nhận",
              hintColor: "#faad14",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "GIƯỜNG ĐANG DÙNG",
              value: "79 / 234",
              accent: "#1677ff",
              hint: "171 trống",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "RAPID ALERT NEWS2.0",
              value: 0,
              accent: "#52c41a",
              hint: "Không theo dõi",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "DỰ BÁO XUẤT VIỆN",
              value: 1,
              accent: "#722ed1",
              hint: "AI predict hôm nay",
              hintColor: "#8b949e",
            },
          },
        ],
      },
      {
        components: [
          {
            type: "WardBedGrid",
            span: 24,
            props: {
              title: "Heatmap giường theo khoa",
              wards: [
                {
                  code: "NTH1",
                  total: 10,
                  occupied: 6,
                  checkout: 0,
                  cleaning: 0,
                  bor: 60,
                },
                {
                  code: "DTL",
                  total: 10,
                  occupied: 4,
                  checkout: 1,
                  cleaning: 0,
                  bor: 47,
                },
                {
                  code: "NCT",
                  total: 25,
                  occupied: 17,
                  checkout: 0,
                  cleaning: 0,
                  bor: 68,
                },
                {
                  code: "NSC",
                  total: 10,
                  occupied: 6,
                  checkout: 0,
                  cleaning: 0,
                  bor: 60,
                },
                {
                  code: "MM",
                  total: 120,
                  occupied: 28,
                  checkout: 5,
                  cleaning: 0,
                  bor: 28,
                },
                {
                  code: "CHTM",
                  total: 15,
                  occupied: 3,
                  checkout: 1,
                  cleaning: 0,
                  bor: 28,
                },
                {
                  code: "GMHS",
                  total: 10,
                  occupied: 3,
                  checkout: 1,
                  cleaning: 0,
                  bor: 36,
                },
                {
                  code: "CTM",
                  total: 16,
                  occupied: 5,
                  checkout: 1,
                  cleaning: 1,
                  bor: 39,
                },
                {
                  code: "RLNT",
                  total: 18,
                  occupied: 4,
                  checkout: 1,
                  cleaning: 0,
                  bor: 28,
                },
                {
                  code: "NCV",
                  total: 20,
                  occupied: 6,
                  checkout: 1,
                  cleaning: 1,
                  bor: 37,
                },
                {
                  code: "PHCN",
                  total: 10,
                  occupied: 3,
                  checkout: 1,
                  cleaning: 0,
                  bor: 37,
                },
              ],
            },
          },
        ],
      },
    ],
  },

  incident: {
    title: "Runbook & Incident",
    rows: [
      {
        components: [
          {
            type: "KpiCard",
            props: { title: "Đang mở", value: 7, accent: "#ff4d4f" },
          },
          {
            type: "KpiCard",
            props: { title: "Critical", value: 2, accent: "#cf1322" },
          },
          {
            type: "KpiCard",
            props: { title: "Đã xử lý hôm nay", value: 4, accent: "#52c41a" },
          },
        ],
      },
    ],
  },

  ambulance: {
    title: "Xe cấp cứu 115",
    rows: [
      {
        components: [
          {
            type: "KpiCard",
            props: { title: "Đang chạy", value: 2, accent: "#ff4d4f" },
          },
          {
            type: "KpiCard",
            props: { title: "Sẵn sàng", value: 1, accent: "#52c41a" },
          },
          {
            type: "KpiCard",
            props: { title: "Bảo trì", value: 1, accent: "#faad14" },
          },
        ],
      },
    ],
  },

  "digital-twin": {
    title: "Digital Twin",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: {
              message: "Tính năng đang phát triển",
              description: "Dữ liệu hiển thị là mô phỏng.",
              type: "info",
            },
          },
        ],
      },
      {
        components: [
          {
            type: "KpiCard",
            props: { title: "Công suất giường (%)", value: 72 },
          },
          { type: "KpiCard", props: { title: "Lưu lượng / giờ", value: 18 } },
          {
            type: "KpiCard",
            props: { title: "Thời gian chờ TB (phút)", value: 23 },
          },
        ],
      },
    ],
  },

  "clinical-path": {
    title: "Clinical Pathway",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Clinical Pathway chuẩn quốc tế — đang phát triển", type: "info" },
          },
        ],
      },
    ],
  },

  // ─── M03 Cận lâm sàng ────────────────────────────────────────────────────
  cdha: {
    title: "M03 - Cận lâm sàng (XN + CĐHA)",
    badge: "LS · PACS",
    badgeColor: "#1677ff",
    subtitle: "XN · Clinical Values · AI Radiology · PACS/LIS Integration · HLT Hub AI",
    actions: [
      { label: "Sync LIS",     variant: "default" },
      { label: "PACS Viewer",  variant: "primary", color: "#1677ff" },
    ],
    tabs: [
      // ── Tab 1: Xét nghiệm (LIS) ──────────────────────────────────────────
      {
        id: "lis",
        label: "📋 Xét nghiệm (LIS)",
        rows: [
          {
            components: [
              {
                type: "KpiCard",
                props: {
                  title: "MẪU ĐANG ĐỢI LY TÂM",
                  value: 0,
                  accent: "#fa8c16",
                  hint: "Huyết học 0 / 0 xét nghiệm",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "TAT HUYẾT HỌC TB",
                  value: 26,
                  accent: "#1677ff",
                  hint: "phút · Chuẩn ±20",
                  hintColor: "#52c41a",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "TAT ĐỊNH LƯỢNG TB",
                  value: 52,
                  accent: "#722ed1",
                  hint: "phút · Chuẩn ±40",
                  hintColor: "#faad14",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "CRITICAL VALUES ĐỢI ĐÁP",
                  value: 18,
                  accent: "#ff4d4f",
                  hint: "Troponin I · 8 chưa xác nhận",
                  hintColor: "#ff4d4f",
                },
              },
            ],
          },
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "🔴  Critical Values — Cần xác nhận trong 30 phút",
                  description: "18 giá trị nguy hiểm đang chờ bác sĩ điều trị xác nhận.",
                  type: "error",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "bn",         title: "BN / MHB" },
                    { key: "xetNghiem", title: "Xét nghiệm" },
                    { key: "ketQua",    title: "Kết quả" },
                    { key: "reference", title: "Reference" },
                    { key: "bsDieuTri", title: "BS điều trị" },
                    {
                      key: "trangThai",
                      title: "Trạng thái",
                      render: "tag",
                      tagColors: {
                        "Chưa xác nhận": "orange",
                        "Đã push":       "blue",
                        "Đã xác nhận":   "green",
                      },
                    },
                    {
                      key: "hanhDong",
                      title: "Hành động",
                      render: "button",
                      buttonColor: "#ff4d4f",
                    },
                  ],
                  data: [
                    {
                      bn:         "Nguyễn Văn An · Tim mạch",
                      xetNghiem:  "Troponin I",
                      ketQua:     "15.4 ng/mL",
                      reference:  "> 8.84",
                      bsDieuTri:  "BS. Hà (ICU)",
                      trangThai:  "Chưa xác nhận",
                      hanhDong:   "Xác nhận",
                    },
                    {
                      bn:         "Trần Thị Bình · Huyết học",
                      xetNghiem:  "Kali máu",
                      ketQua:     "2.2 mmol/L",
                      reference:  "3.5 – 5.8",
                      bsDieuTri:  "BS. Hà (ICU)",
                      trangThai:  "Đã push",
                      hanhDong:   "Xác nhận",
                    },
                    {
                      bn:         "Lê Văn Cường · Nội tổng quát",
                      xetNghiem:  "Glucose",
                      ketQua:     "28.4 mmol/L",
                      reference:  "3.9 – 6.1",
                      bsDieuTri:  "BS. Minh (Nội)",
                      trangThai:  "Chưa xác nhận",
                      hanhDong:   "Xác nhận",
                    },
                    {
                      bn:         "Phạm Thị Dung · Sản khoa",
                      xetNghiem:  "Hb",
                      ketQua:     "5.8 g/dL",
                      reference:  "12 – 16",
                      bsDieuTri:  "BS. Lan (Sản)",
                      trangThai:  "Chưa xác nhận",
                      hanhDong:   "Xác nhận",
                    },
                    {
                      bn:         "Hoàng Văn Em · Thần kinh",
                      xetNghiem:  "NH3",
                      ketQua:     "195 μmol/L",
                      reference:  "11 – 48",
                      bsDieuTri:  "BS. Đức (Thần kinh)",
                      trangThai:  "Đã xác nhận",
                      hanhDong:   "Chi tiết",
                    },
                  ],
                },
              },
            ],
          },
          {
            components: [
              {
                type: "ProgressList",
                span: 14,
                props: {
                  title: "TAT thực tế theo loại XN (phút)",
                  maxValue: 130,
                  items: [
                    { label: "Huyết học STAT",   value: 39, secondaryValue: 59,  color: "#52c41a", secondaryColor: "#faad14" },
                    { label: "Huyết học thường", value: 43, secondaryValue: 60,  color: "#52c41a", secondaryColor: "#faad14" },
                    { label: "Sinh hóa STAT",    value: 58, secondaryValue: 60,  color: "#faad14", secondaryColor: "#faad14" },
                    { label: "Sinh hóa thường",  value: 63, secondaryValue: 90,  color: "#52c41a", secondaryColor: "#faad14" },
                    { label: "Vi sinh (sơ bộ)",  value: 18, secondaryValue: 24,  color: "#52c41a", secondaryColor: "#faad14" },
                    { label: "Miễn dịch",        value: 90, secondaryValue: 120, color: "#faad14", secondaryColor: "#faad14" },
                  ],
                },
              },
              {
                type: "FlowPipeline",
                span: 10,
                props: {
                  title: "Trạng thái mẫu realtime",
                  footer: "QC violations: 8 · Chờ check lại · Retry sensor",
                  stages: [
                    { label: "Ordered",     value: 212, color: "#1677ff" },
                    { label: "In Transit",  value: 42,  color: "#faad14" },
                    { label: "Received",    value: 264, color: "#722ed1" },
                    { label: "In Process",  value: 186, color: "#13c2c2" },
                    { label: "Final",       value: 56,  color: "#52c41a" },
                  ],
                },
              },
            ],
          },
        ],
      },
      // ── Tab 2: Chẩn đoán hình ảnh (PACS) ────────────────────────────────
      {
        id: "pacs",
        label: "📋 Chẩn đoán hình ảnh (PACS)",
        rows: [
          {
            components: [
              {
                type: "KpiCard",
                props: {
                  title: "CHỈ ĐỊNH HÔM NAY",
                  value: 0,
                  accent: "#1677ff",
                  hint: "0 chờ thực hiện",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "TAT CT THƯỜNG",
                  value: "1.4h",
                  accent: "#52c41a",
                  hint: "Chuẩn ≤ 2h",
                  hintColor: "#52c41a",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "HÀNG CHỜ CT",
                  value: 0,
                  accent: "#faad14",
                  hint: "0 đang chờ",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "PACS STORAGE",
                  value: "74%",
                  accent: "#fa8c16",
                  hint: "26% còn trống",
                  hintColor: "#52c41a",
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "accession",  title: "Accession #" },
                    { key: "bn",         title: "Bệnh nhân" },
                    {
                      key: "modality",
                      title: "Modality",
                      render: "tag",
                      tagColors: { CT: "blue", MRI: "purple", XR: "cyan", US: "green", PET: "orange" },
                    },
                    { key: "chiDinh",   title: "Chỉ định" },
                    {
                      key: "trangThai",
                      title: "Trạng thái",
                      render: "tag",
                      tagColors: {
                        "Chờ thực hiện": "orange",
                        "Đang chụp":     "blue",
                        "Chờ đọc":       "purple",
                        "Đã có kết quả": "green",
                      },
                    },
                    { key: "bsDoc",     title: "BS đọc" },
                    {
                      key: "hanhDong",
                      title: "Hành động",
                      render: "button",
                      buttonColor: "#1677ff",
                    },
                  ],
                  data: [
                    {
                      accession: "ACC-26041001",
                      bn:         "Nguyễn Văn An",
                      modality:   "CT",
                      chiDinh:    "CT Ngực không cản quang",
                      trangThai:  "Đã có kết quả",
                      bsDoc:      "BS. Minh",
                      hanhDong:   "Xem PACS",
                    },
                    {
                      accession: "ACC-26041002",
                      bn:         "Trần Thị Bình",
                      modality:   "MRI",
                      chiDinh:    "MRI Sọ não có cản từ",
                      trangThai:  "Chờ đọc",
                      bsDoc:      "—",
                      hanhDong:   "Phân công",
                    },
                    {
                      accession: "ACC-26041003",
                      bn:         "Lê Văn Cường",
                      modality:   "XR",
                      chiDinh:    "X-quang Ngực thẳng",
                      trangThai:  "Đã có kết quả",
                      bsDoc:      "BS. Hà",
                      hanhDong:   "Xem PACS",
                    },
                    {
                      accession: "ACC-26041004",
                      bn:         "Phạm Thị Dung",
                      modality:   "US",
                      chiDinh:    "Siêu âm bụng tổng quát",
                      trangThai:  "Đang chụp",
                      bsDoc:      "BS. Lan",
                      hanhDong:   "Theo dõi",
                    },
                    {
                      accession: "ACC-26041005",
                      bn:         "Hoàng Văn Em",
                      modality:   "CT",
                      chiDinh:    "CT Não khẩn — đột quỵ",
                      trangThai:  "Chờ thực hiện",
                      bsDoc:      "—",
                      hanhDong:   "Ưu tiên",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      // ── Tab 3: AI Radiology ───────────────────────────────────────────────
      {
        id: "ai-radiology",
        label: "🤖 AI Radiology",
        rows: [
          {
            components: [
              {
                type: "KpiCard",
                props: {
                  title: "PHÂN TÍCH AI HÔM NAY",
                  value: 47,
                  accent: "#1677ff",
                  hint: "42 CT · 5 XR",
                  hintColor: "#8b949e",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "FLAGGED BẤT THƯỜNG",
                  value: 3,
                  accent: "#ff4d4f",
                  hint: "Cần BS review ngay",
                  hintColor: "#ff4d4f",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "ĐỘ CHÍNH XÁC AI",
                  value: "94%",
                  accent: "#52c41a",
                  hint: "AUC 0.97 trên test set",
                  hintColor: "#52c41a",
                },
              },
              {
                type: "KpiCard",
                props: {
                  title: "INFERENCE TIME TB",
                  value: "1.2s",
                  accent: "#722ed1",
                  hint: "GPU A100 · batch 4",
                  hintColor: "#8b949e",
                },
              },
            ],
          },
          {
            components: [
              {
                type: "AlertBanner",
                span: 24,
                props: {
                  message: "🤖 AI phát hiện 3 ca nghi ngờ bất thường — cần bác sĩ xác nhận",
                  description: "Tràn dịch màng phổi · Tổn thương nghi ác tính · Xuất huyết não nhỏ",
                  type: "warning",
                  showIcon: false,
                },
              },
            ],
          },
          {
            components: [
              {
                type: "DataTable",
                span: 24,
                props: {
                  columns: [
                    { key: "accession",  title: "Accession #" },
                    { key: "bn",         title: "Bệnh nhân" },
                    {
                      key: "modality",
                      title: "Modality",
                      render: "tag",
                      tagColors: { CT: "blue", MRI: "purple", XR: "cyan" },
                    },
                    { key: "aiFindings",  title: "AI Findings" },
                    { key: "confidence",  title: "Confidence" },
                    {
                      key: "trangThai",
                      title: "Trạng thái",
                      render: "tag",
                      tagColors: {
                        "Chờ BS xác nhận": "orange",
                        "BS đã xác nhận":  "green",
                        "False positive":  "default",
                      },
                    },
                    {
                      key: "hanhDong",
                      title: "Hành động",
                      render: "button",
                      buttonColor: "#722ed1",
                    },
                  ],
                  data: [
                    {
                      accession:   "ACC-26041001",
                      bn:           "Nguyễn Văn An",
                      modality:     "CT",
                      aiFindings:   "Tràn dịch màng phổi phải",
                      confidence:   "91%",
                      trangThai:    "Chờ BS xác nhận",
                      hanhDong:     "Xem AI",
                    },
                    {
                      accession:   "ACC-26041003",
                      bn:           "Lê Văn Cường",
                      modality:     "XR",
                      aiFindings:   "Mờ đáy phổi trái",
                      confidence:   "78%",
                      trangThai:    "BS đã xác nhận",
                      hanhDong:     "Chi tiết",
                    },
                    {
                      accession:   "ACC-26041005",
                      bn:           "Hoàng Văn Em",
                      modality:     "CT",
                      aiFindings:   "Xuất huyết não nhỏ vùng đỉnh",
                      confidence:   "96%",
                      trangThai:    "Chờ BS xác nhận",
                      hanhDong:     "Xem AI",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ─── Placeholder screens ─────────────────────────────────────────────────
  surgery: {
    title: "M04 - Phẫu thuật & Gây mê",
    badge: "OR + GMHS",
    badgeColor: "#1677ff",
    subtitle: "Lịch phòng mổ · OR Utilization · Tracking ca mổ · Kiểm soát nhiễm khuẩn",
    actions: [
      { label: "Lịch tuần",  variant: "default" },
      { label: "OR cấp cứu", variant: "primary", color: "#cf1322" },
    ],
    rows: [
      // Row 1: 4 KPIs
      {
        components: [
          {
            type: "KpiCard",
            props: {
              title: "SỐ PHÒNG MỔ",
              value: 8,
              accent: "#1677ff",
              hint: "5 đang mổ · 1 vệ sinh",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "OR UTILIZATION",
              value: "0%",
              accent: "#faad14",
              hint: "⚠ Mục tiêu 75-85%",
              hintColor: "#faad14",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "CA MỔ HÔM NAY",
              value: "0/0",
              accent: "#52c41a",
              hint: "0 đã hoàn thành",
              hintColor: "#8b949e",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "SSI RATE (30D)",
              value: "0%",
              accent: "#52c41a",
              hint: "✓ Chuẩn <3%",
              hintColor: "#52c41a",
            },
          },
        ],
      },
      // Row 2: OR Room Grid
      {
        components: [
          {
            type: "OrRoomGrid",
            span: 24,
            props: {
              title: "🟢 Trạng thái 8 phòng mổ — Realtime",
              rooms: [
                { code: "OR-01", procedure: "Nội soi tiêu hóa",     status: "active",    hint: "Sắp xong" },
                { code: "OR-02", procedure: "Cắt ruột thừa nội soi", status: "active",    hint: "Sắp xong" },
                { code: "OR-03", procedure: "Thay khớp háng",        status: "active",    hint: "Sắp xong" },
                { code: "OR-04", procedure: "Sinh mổ lần 2",         status: "preparing", hint: "Sắp bắt đầu" },
                { code: "OR-05", procedure: "CABG (Bắc cầu vành)",   status: "active",    hint: "Sắp xong" },
                { code: "OR-06", procedure: "Mổ lấy thai",           status: "active",    hint: "Sắp xong" },
                { code: "OR-07",                                      status: "cleaning" },
                { code: "OR-08",                                      status: "available", hint: "Dự phòng cấp cứu" },
              ],
            },
          },
        ],
      },
      // Row 3: Timeline + Supply inventory
      {
        components: [
          {
            type: "AlertBanner",
            span: 12,
            props: {
              message: "⏰ Timeline ca mổ đang diễn ra",
              description: "Không có ca nào đang diễn ra",
              type: "info",
              showIcon: false,
            },
          },
          {
            type: "ProgressList",
            span: 12,
            props: {
              title: "🏥 Vật tư phòng mổ — Kiểm kê tự động",
              maxValue: 100,
              items: [
                { label: "Chỉ phẫu thuật 3/0", value: 85, color: "#52c41a" },
                { label: "Dao điện đầu nhỏ",   value: 8,  color: "#ff4d4f" },
                { label: "Găng tay pt size 7", value: 23, color: "#faad14" },
                { label: "Gạc vô trùng",       value: 62, color: "#52c41a" },
                { label: "Van tim sinh học",    value: 40, color: "#52c41a" },
              ],
              footerActions: [
                { label: "⚠ Dao điện đầu nhỏ đã đặt auto-order → M07", variant: "link" },
              ],
            },
          },
        ],
      },
    ],
  },

  quality: {
    title: "Chất lượng & An toàn bệnh nhân",
    badge: "ATBT",
    subtitle: "JCI · ISO 15189 · Indicator tracking · RCA",
    rows: [
      {
        components: [
          { type: "KpiCard", props: { title: "Chỉ số đạt chuẩn",  value: "87%", accent: "#52c41a", hint: "↑ 2% so tháng trước", hintColor: "#52c41a" } },
          { type: "KpiCard", props: { title: "Sự cố đang xử lý",  value: 4,     accent: "#ff4d4f" } },
          { type: "KpiCard", props: { title: "RCA chờ phê duyệt", value: 2,     accent: "#faad14" } },
          { type: "KpiCard", props: { title: "Audit tháng này",    value: 18,    accent: "#1677ff" } },
        ],
      },
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Module Chất lượng & ATBT đang phát triển — dữ liệu mô phỏng", type: "info" },
          },
        ],
      },
    ],
  },

  "patient-journey": {
    title: "Patient Journey",
    badge: "UX",
    subtitle: "End-to-end trải nghiệm bệnh nhân · NPS · Wait time",
    rows: [
      {
        components: [
          { type: "KpiCard", props: { title: "NPS tháng này",     value: 72,    accent: "#52c41a", hint: "↑ 4 điểm", hintColor: "#52c41a" } },
          { type: "KpiCard", props: { title: "Thời gian chờ TB",  value: "23 p",accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Phản hồi tiêu cực", value: 8,     accent: "#ff4d4f" } },
          { type: "KpiCard", props: { title: "Check-in digital",  value: "61%", accent: "#722ed1" } },
        ],
      },
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Module Patient Journey đang phát triển — dữ liệu mô phỏng", type: "info" },
          },
        ],
      },
    ],
  },

  ecosystem: {
    title: "Ecosystem Integration",
    badge: "API",
    subtitle: "HIS · LIS · PACS · Pharma · Insurance · HL7 FHIR",
    rows: [
      {
        components: [
          { type: "KpiCard", props: { title: "Kết nối active",   value: 14,    accent: "#52c41a" } },
          { type: "KpiCard", props: { title: "API calls / giờ",  value: "2.4k",accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Lỗi 24h qua",      value: 3,     accent: "#ff4d4f", hint: "SLA: < 5", hintColor: "#52c41a" } },
          { type: "KpiCard", props: { title: "Latency TB (ms)",   value: 142,   accent: "#faad14" } },
        ],
      },
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Module Ecosystem Integration đang phát triển — dữ liệu mô phỏng", type: "info" },
          },
        ],
      },
    ],
  },

  "executive-kpi": {
    title: "Executive KPI Dashboard",
    badge: "C-SUITE",
    subtitle: "BSC · OKR · Strategic indicators · Board reporting",
    rows: [
      {
        components: [
          { type: "KpiCard", props: { title: "Revenue YTD (tỷ)",     value: "48.2", accent: "#52c41a", hint: "↑ 12% so kế hoạch", hintColor: "#52c41a" } },
          { type: "KpiCard", props: { title: "EBITDA Margin",         value: "18%",  accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Patient Satisfaction",  value: "4.3",  accent: "#722ed1", hint: "/ 5.0", hintColor: "#8b949e" } },
          { type: "KpiCard", props: { title: "Market Share (%)",      value: "23.1", accent: "#fa8c16" } },
        ],
      },
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Module Executive KPI đang phát triển — dữ liệu mô phỏng", type: "info" },
          },
        ],
      },
    ],
  },

  "ai-chatbot": {
    title: "AI Chatbot & Voice",
    badge: "AI",
    subtitle: "Conversational AI · Voice assistant · Auto-triage · FAQ bot",
    rows: [
      {
        components: [
          { type: "KpiCard", props: { title: "Cuộc hội thoại / ngày", value: 340, accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Tỉ lệ giải quyết",      value: "78%",accent: "#52c41a", hint: "↑ 5% tuần trước", hintColor: "#52c41a" } },
          { type: "KpiCard", props: { title: "Escalate to human",      value: 22,   accent: "#faad14" } },
          { type: "KpiCard", props: { title: "CSAT score",             value: "4.1",accent: "#722ed1", hint: "/ 5.0", hintColor: "#8b949e" } },
        ],
      },
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Module AI Chatbot & Voice đang phát triển — dữ liệu mô phỏng", type: "info" },
          },
        ],
      },
    ],
  },

  "hr-credential": {
    title: "Nhân sự & Credentialing",
    badge: "HR",
    subtitle: "Workforce · Credentialing · CME tracking · Scheduling",
    rows: [
      {
        components: [
          { type: "KpiCard", props: { title: "Tổng nhân viên",        value: 1240,  accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Chứng chỉ hết hạn",     value: 14,    accent: "#ff4d4f", hint: "Trong 30 ngày tới", hintColor: "#faad14" } },
          { type: "KpiCard", props: { title: "CME giờ TB (năm)",      value: "42h", accent: "#52c41a" } },
          { type: "KpiCard", props: { title: "Tuyển dụng đang mở",    value: 8,     accent: "#722ed1" } },
        ],
      },
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Module Nhân sự & Credentialing đang phát triển — dữ liệu mô phỏng", type: "info" },
          },
        ],
      },
    ],
  },

  "population-health": {
    title: "Population Health",
    badge: "NEW",
    subtitle: "Epidemiology · Risk stratification · Preventive care · Cohort analytics",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Population Health Management — đang phát triển", type: "info" },
          },
        ],
      },
      {
        components: [
          { type: "KpiCard", props: { title: "Bệnh nhân theo dõi",   value: "12.4k", accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Nguy cơ cao (30d)",    value: 284,     accent: "#ff4d4f" } },
          { type: "KpiCard", props: { title: "Chương trình phòng bệnh", value: 6,   accent: "#52c41a" } },
        ],
      },
    ],
  },

  research: {
    title: "Research Platform",
    badge: "NEW",
    subtitle: "Clinical trials · RWE · Data science · Publications",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Research Platform đang phát triển", type: "info" },
          },
        ],
      },
      {
        components: [
          { type: "KpiCard", props: { title: "Nghiên cứu active",    value: 7,     accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Bệnh nhân tuyển",      value: 183,   accent: "#722ed1" } },
          { type: "KpiCard", props: { title: "Bài báo năm nay",      value: 12,    accent: "#52c41a" } },
        ],
      },
    ],
  },

  "multi-hospital": {
    title: "Multi-Hospital Network",
    badge: "NEW",
    subtitle: "Network analytics · Benchmarking · Resource sharing · Transfer hub",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: { message: "Multi-Hospital Network đang phát triển", type: "info" },
          },
        ],
      },
      {
        components: [
          { type: "KpiCard", props: { title: "Cơ sở trong mạng",    value: 5,     accent: "#1677ff" } },
          { type: "KpiCard", props: { title: "Chuyển viện hôm nay", value: 8,     accent: "#faad14" } },
          { type: "KpiCard", props: { title: "Tổng BN toàn mạng",   value: "2.1k",accent: "#722ed1" } },
        ],
      },
    ],
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const config = SCREENS[id];
  if (!config) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }
  return NextResponse.json(config);
}
