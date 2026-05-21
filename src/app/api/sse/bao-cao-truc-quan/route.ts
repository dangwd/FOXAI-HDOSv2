export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Dữ liệu gốc theo khoa ───────────────────────────────────────────────────

const KHOA_BASE = [
  { maKhoa: "KH0001", tenKhoa: "Khoa Nội - Hồi Sức Cấp Cứu",     soBN: 1,  tongThu: 1110710,  bhytTra: 787111,   bnTra: 306966,   haoPhi: 16633 },
  { maKhoa: "PH0000", tenKhoa: "Phòng khám Nội 1",                 soBN: 12, tongThu: 10330308, bhytTra: 1109857,  bnTra: 9196538,  haoPhi: 23913 },
  { maKhoa: "PH0001", tenKhoa: "Phòng khám Ngoại",                 soBN: 1,  tongThu: 293461,   bhytTra: 291844,   bnTra: 1617,     haoPhi: 0     },
  { maKhoa: "PH0002", tenKhoa: "Phòng khám Nhi",                   soBN: 1,  tongThu: 36189,    bhytTra: 36189,    bnTra: 0,        haoPhi: 0     },
  { maKhoa: "PH0004", tenKhoa: "Phòng khám Huyết áp Tiểu đường",  soBN: 13, tongThu: 5095476,  bhytTra: 4790725,  bnTra: 304751,   haoPhi: 0     },
  { maKhoa: "PH0005", tenKhoa: "Phòng khám Sản",                   soBN: 1,  tongThu: 412446,   bhytTra: 0,        bnTra: 412446,   haoPhi: 0     },
  { maKhoa: "PH0006", tenKhoa: "Phòng khám Da liễu",               soBN: 7,  tongThu: 664185,   bhytTra: 617656,   bnTra: 46529,    haoPhi: 0     },
  { maKhoa: "PH0016", tenKhoa: "Phòng khám Nội 2",                 soBN: 20, tongThu: 4287204,  bhytTra: 2894672,  bnTra: 1332016,  haoPhi: 60516 },
];

function fmt(n: number): string {
  return n.toLocaleString("vi-VN");
}

function jitter(base: number, pct = 0.03): number {
  return Math.round(base * (1 + (Math.random() - 0.5) * pct * 2));
}

// ─── Generators ──────────────────────────────────────────────────────────────

/**
 * Event: "kpi-luot-kham"
 * Shape: { value: string; hint: string; hintColor: string }
 */
function generateKpiLuotKham() {
  const rows  = KHOA_BASE.map((k) => ({ ...k, soBN: jitter(k.soBN, 0.05) }));
  const total = rows.reduce((s, r) => s + r.soBN, 0);
  const top   = rows.sort((a, b) => b.soBN - a.soBN)[0];
  return {
    value: `${total} Bệnh nhân`,
    hint: `Khoa cao nhất: ${top.tenKhoa.replace("Phòng khám ", "PK ")} — ${top.soBN} BN`,
    hintColor: "#1677ff",
  };
}

/**
 * Event: "kpi-doanh-thu"
 * Shape: { value: string; hint: string; hintColor: string }
 */
function generateKpiDoanhThu() {
  const rows   = KHOA_BASE.map((k) => ({
    tongThu:  jitter(k.tongThu),
    bhytTra:  jitter(k.bhytTra),
    bnTra:    jitter(k.bnTra),
  }));
  const tong   = rows.reduce((s, r) => s + r.tongThu, 0);
  const bhyt   = rows.reduce((s, r) => s + r.bhytTra, 0);
  const bn     = rows.reduce((s, r) => s + r.bnTra,   0);
  return {
    value: `${fmt(tong)} VND`,
    hint: `BHYT: ${fmt(bhyt)} · BN trả: ${fmt(bn)}`,
    hintColor: "#8c8c8c",
  };
}

/**
 * Event: "kpi-avg-bn"
 * Shape: { value: string; hint: string; hintColor: string }
 */
function generateKpiAvgBn() {
  const rows  = KHOA_BASE.map((k) => ({ tongThu: jitter(k.tongThu), bhytTra: jitter(k.bhytTra), soBN: jitter(k.soBN, 0.05) }));
  const tong  = rows.reduce((s, r) => s + r.tongThu, 0);
  const bhyt  = rows.reduce((s, r) => s + r.bhytTra, 0);
  const total = rows.reduce((s, r) => s + r.soBN, 0);
  const avg   = total > 0 ? Math.round(tong / total) : 0;
  const bhytPct = tong > 0 ? ((bhyt / tong) * 100).toFixed(1) : "0";
  return {
    value: `${fmt(avg)} VND`,
    hint: `Tỉ lệ BHYT: ${bhytPct}%`,
    hintColor: "#8c8c8c",
  };
}

/**
 * Event: "table-chi-tiet-khoa"
 * Shape: { data: KhoaRow[] }
 *
 * KhoaRow: {
 *   maKhoa:  string   — mã khoa/phòng
 *   tenKhoa: string   — tên khoa/phòng
 *   soBN:    number   — số bệnh nhân
 *   tongThu: string   — tổng thu (VND, formatted)
 *   bhytTra: string   — BHYT trả (VND, formatted)
 *   bnTra:   string   — bệnh nhân tự trả (VND, formatted)
 *   haoPhi:  string   — hao phí/khác (VND, formatted)
 * }
 * Dòng cuối cùng là tổng cộng (maKhoa = "")
 */
function generateTableChiTiet() {
  const rows = KHOA_BASE.map((k) => {
    const tongThu = jitter(k.tongThu);
    const bhytTra = jitter(k.bhytTra);
    const bnTra   = jitter(k.bnTra);
    const haoPhi  = jitter(k.haoPhi);
    const soBN    = jitter(k.soBN, 0.05);
    return { maKhoa: k.maKhoa, tenKhoa: k.tenKhoa, soBN, tongThu, bhytTra, bnTra, haoPhi };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      soBN:    acc.soBN    + r.soBN,
      tongThu: acc.tongThu + r.tongThu,
      bhytTra: acc.bhytTra + r.bhytTra,
      bnTra:   acc.bnTra   + r.bnTra,
      haoPhi:  acc.haoPhi  + r.haoPhi,
    }),
    { soBN: 0, tongThu: 0, bhytTra: 0, bnTra: 0, haoPhi: 0 },
  );

  return {
    data: [
      ...rows.map((r) => ({
        maKhoa:  r.maKhoa,
        tenKhoa: r.tenKhoa,
        soBN:    r.soBN,
        tongThu: fmt(r.tongThu),
        bhytTra: fmt(r.bhytTra),
        bnTra:   fmt(r.bnTra),
        haoPhi:  r.haoPhi > 0 ? fmt(r.haoPhi) : "0",
      })),
      {
        maKhoa:  "",
        tenKhoa: "Tổng cộng",
        soBN:    totals.soBN,
        tongThu: fmt(totals.tongThu),
        bhytTra: fmt(totals.bhytTra),
        bnTra:   fmt(totals.bnTra),
        haoPhi:  "—",
      },
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
        const events: Record<string, object> = {
          "kpi-luot-kham":       generateKpiLuotKham(),
          "kpi-doanh-thu":       generateKpiDoanhThu(),
          "kpi-avg-bn":          generateKpiAvgBn(),
          "table-chi-tiet-khoa": generateTableChiTiet(),
        };

        for (const [name, payload] of Object.entries(events)) {
          controller.enqueue(
            encoder.encode(`event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        }
      }

      tick();

      const delay = () => 5000 + Math.random() * 5000; // 5-10s
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
