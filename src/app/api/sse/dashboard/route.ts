export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── KPI cards ───────────────────────────────────────────────────────────────

function generateKpis() {
  const visits    = Math.round(151 + (Math.random() - 0.5) * 18);
  const inpatient = Math.round(312 + (Math.random() - 0.5) * 14);
  const borVal    = +(78.4 + (Math.random() - 0.5) * 3.0).toFixed(1);
  const revVal    = +(4.23 + (Math.random() - 0.5) * 0.18).toFixed(2);
  const alerts    = Math.max(0, Math.round(8 + (Math.random() - 0.5) * 4));
  const vDelta    = visits - 151;

  return {
    "kpi-visits": {
      value: visits,
      hint: `${vDelta >= 0 ? "+" : ""}${vDelta}% hôm qua`,
      hintColor: vDelta >= 0 ? "#52c41a" : "#ff4d4f",
    },
    "kpi-revenue": {
      value: `${revVal} tỷ`,
      hint: `${revVal >= 4.23 ? "+" : ""}${((revVal / 4.23 - 1) * 100).toFixed(1)}% so kế hoạch`,
      hintColor: revVal >= 4.23 ? "#52c41a" : "#ff4d4f",
    },
    "kpi-inpatient": {
      value: inpatient,
      hint: `${inpatient > 312 ? "+" : ""}${inpatient - 312} so sáng nay`,
      hintColor: "#52c41a",
    },
    "kpi-bor": {
      value: `${borVal}%`,
      hint: `${borVal >= 78.4 ? "+" : ""}${(borVal - 78.4).toFixed(1)}%`,
      hintColor: borVal >= 78.4 ? "#52c41a" : "#ff4d4f",
    },
    "kpi-alerts": {
      value: alerts,
      hint: `${alerts} cần xử lý ngay`,
      hintColor: alerts >= 8 ? "#ff4d4f" : "#faad14",
    },
  };
}

// ─── Bed capacity (ProgressList) ─────────────────────────────────────────────

const BED_BASES = [
  { label: "ICU",                          base: 80,  cap: 90  },
  { label: "Khoa Nội tim mạch",            base: 84,  cap: 90  },
  { label: "Khoa Nội tổng quát (ICU)",     base: 90,  cap: 95  },
  { label: "Ung bướu",                     base: 87,  cap: 90  },
  { label: "Khoa Tim mạch can thiệp",      base: 78,  cap: 85  },
  { label: "Khoa Nội tổng quát",           base: 72,  cap: 80  },
  { label: "Khoa Ngoại tổng quát",         base: 61,  cap: 75  },
  { label: "Khoa Nhi",                     base: 54,  cap: 70  },
  { label: "Khoa Thần kinh",               base: 62,  cap: 75  },
  { label: "Khoa Sản khoa",                base: 53,  cap: 70  },
  { label: "Khoa Hồi lưu",                 base: 49,  cap: 65  },
];

function bedColor(pct: number): string {
  if (pct >= 90) return "#ff4d4f";
  if (pct >= 75) return "#faad14";
  return "#52c41a";
}

function generateBeds() {
  const items = BED_BASES.map(({ label, base, cap }) => {
    const value = Math.min(cap, Math.max(0, Math.round(base + (Math.random() - 0.5) * 10)));
    return { label, value, secondaryValue: cap, color: bedColor((value / cap) * 100) };
  });
  return { items };
}

// ─── Alert list ──────────────────────────────────────────────────────────────

const ALERT_POOL = [
  { code: "TnI",  text: "Troponin I > 12.4 ng/mL",  patient: "BN: Nguyễn Văn An",    dept: "Khoa Nội tim mạch",    severity: "critical" as const },
  { code: "Kx",   text: "Kx > 2.2 mmol/L",           patient: "BN: Trần Thị Bình",    dept: "Khoa Cấp cứu",         severity: "critical" as const },
  { code: "Na+",  text: "Na+ < 118 mmol/L",           patient: "BN: Lê Văn Cường",     dept: "Khoa Nội tổng quát",   severity: "warning"  as const },
  { code: "PTx",  text: "PTx > 22%",                  patient: "BN: Phạm Thị Dung",    dept: "Khoa Huyết học",       severity: "warning"  as const },
  { code: "NH3",  text: "NH3 > 185 μmol/L",           patient: "BN: Hoàng Văn Em",     dept: "Khoa Gan mật",         severity: "warning"  as const },
  { code: "Hb",   text: "Hb < 6.0 g/dL",             patient: "BN: Vũ Thị Phương",    dept: "Khoa Sản",             severity: "critical" as const },
  { code: "K+",   text: "K+ > 6.5 mmol/L",            patient: "BN: Đinh Văn Giang",   dept: "Khoa Thận",            severity: "critical" as const },
  { code: "INR",  text: "INR > 4.5",                  patient: "BN: Bùi Thị Hoa",      dept: "Khoa Huyết học",       severity: "warning"  as const },
  { code: "Glc",  text: "Glucose > 28 mmol/L",        patient: "BN: Ngô Văn Hùng",     dept: "Khoa Nội tổng quát",   severity: "critical" as const },
  { code: "CRP",  text: "CRP > 200 mg/L",             patient: "BN: Lý Thị Kim",       dept: "Khoa Nhiễm",           severity: "warning"  as const },
  { code: "SpO2", text: "SpO₂ < 88%",                 patient: "BN: Võ Văn Lâm",       dept: "Khoa Hô hấp",          severity: "critical" as const },
  { code: "HR",   text: "HR > 145 bpm",               patient: "BN: Đỗ Thị Mai",       dept: "Khoa Tim mạch",        severity: "critical" as const },
  { code: "BP",   text: "HA tâm thu > 200 mmHg",      patient: "BN: Phan Văn Nam",      dept: "Khoa Cấp cứu",         severity: "critical" as const },
  { code: "Lac",  text: "Lactate > 4.0 mmol/L",       patient: "BN: Nguyễn Thị Oanh",  dept: "Khoa Hồi sức tích cực",severity: "critical" as const },
  { code: "Ca²⁺", text: "Ca²⁺ < 1.8 mmol/L",         patient: "BN: Trương Văn Phú",   dept: "Khoa Ngoại tổng quát", severity: "warning"  as const },
  { code: "WBC",  text: "WBC > 25 G/L",               patient: "BN: Lưu Thị Quỳnh",    dept: "Khoa Huyết học",       severity: "warning"  as const },
  { code: "PCT",  text: "Procalcitonin > 10 ng/mL",   patient: "BN: Mai Văn Sơn",      dept: "Khoa Nhiễm",           severity: "critical" as const },
  { code: "Plt",  text: "Tiểu cầu < 20 G/L",         patient: "BN: Đặng Thị Thủy",    dept: "Khoa Huyết học",       severity: "critical" as const },
];

function randomTime(): string {
  const r = Math.random();
  if (r < 0.08) return "vừa xong";
  if (r < 0.20) return `${10 + Math.round(Math.random() * 50)} giây trước`;
  if (r < 0.85) return `${1 + Math.round(Math.random() * 29)} phút trước`;
  return `${1 + Math.round(Math.random() * 3)} giờ trước`;
}

function generateAlerts() {
  const shuffled = [...ALERT_POOL].sort(() => Math.random() - 0.5);
  const count    = 5 + Math.round(Math.random() * 4); // 5-9 alerts
  const items    = shuffled.slice(0, count).map((a) => ({ ...a, time: randomTime() }));
  return { totalCount: count, items };
}

// ─── Patient flow pipeline ────────────────────────────────────────────────────

function generateFlow() {
  const waiting   = Math.round(46 + (Math.random() - 0.5) * 14);
  const inpatient = Math.round(79 + (Math.random() - 0.5) * 10);
  const total     = Math.round(148 + (Math.random() - 0.5) * 8);
  const completed = Math.round(Math.random() * 6);
  return {
    stages: [
      { label: "Tổng lịch",    value: total,     color: "#1677ff" },
      { label: "Chờ khám",     value: waiting,   color: "#faad14" },
      { label: "Đang nội trú", value: inpatient, color: "#722ed1" },
      { label: "Hoàn thành",   value: completed, color: "#52c41a" },
    ],
  };
}

// ─── Revenue donut ────────────────────────────────────────────────────────────

function generateRevenuePie() {
  const bhyt    = 58 + Math.round((Math.random() - 0.5) * 6);
  const vienPhi = 27 + Math.round((Math.random() - 0.5) * 4);
  const dichVu  = 12 + Math.round((Math.random() - 0.5) * 3);
  const bhKhac  = Math.max(1, 100 - bhyt - vienPhi - dichVu);
  return {
    data: [
      { label: "BHYT",     value: bhyt    },
      { label: "Viện phí", value: vienPhi },
      { label: "Dịch vụ",  value: dichVu  },
      { label: "BH Khác",  value: bhKhac  },
    ],
  };
}

// ─── SSE handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      function tick() {
        const all: Record<string, object> = {
          ...generateKpis(),
          "chart-beds":        generateBeds(),
          "chart-alerts":      generateAlerts(),
          "chart-flow":        generateFlow(),
          "chart-revenue-pie": generateRevenuePie(),
        };

        for (const [name, data] of Object.entries(all)) {
          controller.enqueue(
            encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        }
      }

      tick();

      const delay = () => 1000 + Math.random() * 1000;
      let timer: ReturnType<typeof setTimeout>;

      const schedule = () => {
        timer = setTimeout(() => {
          try { tick(); schedule(); } catch { /* stream closed */ }
        }, delay());
      };

      schedule();

      request.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        try { controller.close(); } catch { /* ignore */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
