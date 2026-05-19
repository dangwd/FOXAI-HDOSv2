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
      // Row 1: 5 KPI cards
      {
        components: [
          {
            type: "KpiCard",
            props: {
              title: "LƯỢT KHÁM HÔM NAY",
              value: 150,
              accent: "#1677ff",
              hint: "+42% hôm qua",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
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
            props: {
              title: "BOR TOÀN VIỆN",
              value: "78.4%",
              accent: "#fa8c16",
              hint: "+2.1%",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            props: {
              title: "CẢNH BÁO ACTIVE",
              value: 8,
              accent: "#ff4d4f",
              hint: "2.13 cần xử lý ngay",
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
            props: {
              title: "Công suất giường theo khoa",
              realtimeBadge: true,
              showFraction: true,
              items: [
                { label: "ICU",                      value: 47, secondaryValue: 50, color: "#ff4d4f" },
                { label: "Khoa Nội tim mạch",        value: 45, secondaryValue: 50, color: "#faad14" },
                { label: "Khoa Nội tổng quát (ICU)", value: 45, secondaryValue: 50, color: "#ff4d4f" },
                { label: "Ung bướu",                 value: 39, secondaryValue: 45, color: "#faad14" },
                { label: "Khoa Tim mạch can thiệp",  value: 37, secondaryValue: 48, color: "#faad14" },
                { label: "Khoa Nội tổng quát",       value: 36, secondaryValue: 50, color: "#52c41a" },
                { label: "Khoa Ngoại tổng quát",     value: 33, secondaryValue: 52, color: "#52c41a" },
                { label: "Khoa Nhi",                 value: 27, secondaryValue: 50, color: "#52c41a" },
                { label: "Khoa Thần kinh",            value: 31, secondaryValue: 50, color: "#52c41a" },
                { label: "Khoa Sản khoa",            value: 25, secondaryValue: 47, color: "#52c41a" },
                { label: "Khoa Nội tiết",            value: 22, secondaryValue: 45, color: "#52c41a" },
              ],
              footerActions: [
                { label: "18 khoa · Xem chi tiết →", variant: "link" },
              ],
            },
          },
          {
            type: "AlertList",
            span: 8,
            props: {
              title: "Cảnh báo đang kích hoạt",
              totalCount: 8,
              items: [
                { code: "1.3", text: "PTx > 22% — BN: Phạm Thị D",          patient: "Khoa Huyết học", time: "16 phút trước", severity: "warning" },
                { code: "1.3", text: "NH3 > 185 μmol/L — BN: Hoàng Văn E",   patient: "Khoa Gan mật",   time: "24 phút trước", severity: "warning" },
                { code: "1.1", text: "Glucose > 22 mmol/L — BN: Vũ Thị F",   patient: "Khoa Nội tiết",  time: "36 phút trước", severity: "warning" },
                { code: "1.1", text: "Hb > 5.8 g/dL — BN: Đặng Văn G",       patient: "Khoa Ung bướu",  time: "42 phút trước", severity: "warning" },
                { code: "1.1", text: "Ca++ > 2.1 mmol/L — BN: Ngô Thị H",    patient: "Khoa Thận",      time: "08 phút trước", severity: "warning" },
              ],
            },
          },
        ],
      },
      // Row 3: FlowPipeline (span 16) + ProgressList doanh thu (span 8)
      {
        components: [
          {
            type: "FlowPipeline",
            span: 16,
            props: {
              title: "Dòng bệnh nhân hôm nay",
              realtimeBadge: true,
              footer: "T/BT: 38 phút · Tracking từ đăng ký đến hoàn thành",
              stages: [
                { label: "Tổng lịch",    value: 148, color: "#1677ff" },
                { label: "Chờ khám",     value: 46,  color: "#faad14" },
                { label: "Đang nội trú", value: 79,  color: "#722ed1" },
                { label: "Hoàn thành",   value: 0,   color: "#52c41a" },
              ],
            },
          },
          {
            type: "ProgressList",
            span: 8,
            props: {
              title: "Phân loại doanh thu",
              maxValue: 100,
              items: [
                { label: "BHYT",     value: 68, color: "#1677ff" },
                { label: "Viện phí", value: 27, color: "#fa8c16" },
                { label: "Dịch vụ", value: 12, color: "#52c41a" },
                { label: "BH Khác",  value: 3,  color: "#8b949e" },
              ],
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
      { label: "+ Điều phối phòng khám", variant: "primary", color: "#52c41a" },
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
                { label: "Nội Th-01", value: 22, secondaryValue: 45, color: "#52c41a", secondaryColor: "#faad14" },
                { label: "Nội Th-02", value: 19, secondaryValue: 40, color: "#52c41a", secondaryColor: "#faad14" },
                { label: "Nội Th-03", value: 44, secondaryValue: 55, color: "#ff4d4f", secondaryColor: "#faad14" },
                { label: "Ngoại-01",  value: 31, secondaryValue: 48, color: "#faad14", secondaryColor: "#faad14" },
                { label: "Nội-02",    value: 25, secondaryValue: 42, color: "#52c41a", secondaryColor: "#faad14" },
                { label: "Răng-01",   value: 12, secondaryValue: 30, color: "#52c41a", secondaryColor: "#faad14" },
                { label: "Mắt-01",    value: 18, secondaryValue: 35, color: "#52c41a", secondaryColor: "#faad14" },
                { label: "Phụ khoa-01", value: 29, secondaryValue: 45, color: "#faad14", secondaryColor: "#faad14" },
                { label: "Tim mạch-01", value: 35, secondaryValue: 50, color: "#faad14", secondaryColor: "#faad14" },
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
                { key: "thucTe",  color: "#52c41a", name: "Thực tế" },
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
                { label: "15h", aiDuBao: 97,  caoDiem: 100 },
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
              footer: "Cập nhật mỗi 5 phút · Đã Th 6 phút · Trung bình kỳ đến tặc thành tuần",
              stages: [
                { label: "Đăng ký",    value: 3, color: "#1677ff" },
                { label: "Chờ khám",   value: 0, color: "#faad14" },
                { label: "Đang khám",  value: 0, color: "#1677ff" },
                { label: "Chờ CLS",    value: 0, color: "#722ed1" },
                { label: "Nhận kết",   value: 0, color: "#13c2c2" },
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
                { ma: "CU-B01", benhNhan: "Nguyễn Văn An", triage: "P1", cho: "7 phút",  bs: "—",          trangThai: "Chưa phân công", hanhDong: "Update" },
                { ma: "CU-B02", benhNhan: "Trần Thị B",    triage: "P1", cho: "3 phút",  bs: "Bs. Bình",   trangThai: "Đang xử lý",     hanhDong: "Update" },
                { ma: "CU-B03", benhNhan: "Lê Văn C",      triage: "P2", cho: "16 phút", bs: "Bs. Đức",    trangThai: "Đang xử lý",     hanhDong: "Update" },
                { ma: "CU-B04", benhNhan: "Phạm Thị D",    triage: "P2", cho: "11 phút", bs: "—",          trangThai: "Chưa phân công", hanhDong: "Update" },
                { ma: "CU-B05", benhNhan: "Hoàng Văn E",   triage: "P3", cho: "5 phút",  bs: "BS. Giang",  trangThai: "Đang xử lý",     hanhDong: "Update" },
              ],
            },
          },
        ],
      },
    ],
  },

  finance: {
    title: "Tài chính RCM+DRG",
    rows: [
      {
        components: [
          {
            type: "KpiCard",
            props: {
              title: "Doanh thu tháng (tr.)",
              value: 1240,
              accent: "#52c41a",
              hint: "↑ 8%",
              hintColor: "#52c41a",
            },
          },
          {
            type: "KpiCard",
            props: { title: "Chi phí (tr.)", value: 876, accent: "#ff4d4f" },
          },
          {
            type: "KpiCard",
            props: { title: "Lợi nhuận (tr.)", value: 364, accent: "#1677ff" },
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
                { key: "drg", title: "Mã DRG" },
                { key: "desc", title: "Mô tả" },
                { key: "cases", title: "Số ca" },
                { key: "revenue", title: "Doanh thu (tr.)" },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: "tag",
                  tagColors: { Đạt: "green", "Không đạt": "red" },
                },
              ],
              data: [
                {
                  drg: "DRG-470",
                  desc: "Thay khớp háng",
                  cases: 12,
                  revenue: 480,
                  status: "Đạt",
                },
                {
                  drg: "DRG-291",
                  desc: "Suy tim nặng",
                  cases: 8,
                  revenue: 192,
                  status: "Đạt",
                },
                {
                  drg: "DRG-193",
                  desc: "Bệnh phổi nặng",
                  cases: 15,
                  revenue: 210,
                  status: "Không đạt",
                },
              ],
            },
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
    title: "AI Lâm sàng CDSS",
    rows: [
      {
        components: [
          {
            type: "AlertBanner",
            span: 24,
            props: {
              message: "Hệ thống hỗ trợ quyết định lâm sàng đang hoạt động",
              type: "info",
            },
          },
        ],
      },
      {
        components: [
          {
            type: "KpiCard",
            props: { title: "Cảnh báo hôm nay", value: 3, accent: "#ff4d4f" },
          },
          {
            type: "KpiCard",
            props: { title: "Tương tác thuốc", value: 7, accent: "#faad14" },
          },
          {
            type: "KpiCard",
            props: {
              title: "Gợi ý chấp nhận",
              value: 21,
              accent: "#52c41a",
              hint: "87% acceptance rate",
              hintColor: "#52c41a",
            },
          },
        ],
      },
    ],
  },

  inpatient: {
    title: "Giường & Nội trú",
    rows: [
      {
        components: [
          {
            type: "KpiCard",
            props: { title: "Tổng giường", value: 120, accent: "#1677ff" },
          },
          {
            type: "KpiCard",
            props: { title: "Đang sử dụng", value: 87, accent: "#ff4d4f" },
          },
          {
            type: "KpiCard",
            props: { title: "Còn trống", value: 33, accent: "#52c41a" },
          },
          {
            type: "KpiCard",
            props: {
              title: "Công suất ICU (%)",
              value: 67,
              accent: "#faad14",
              hint: "8/12 giường",
              hintColor: "#faad14",
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
            props: {
              message: "Clinical Pathway chuẩn quốc tế — đang phát triển",
              type: "info",
            },
          },
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
