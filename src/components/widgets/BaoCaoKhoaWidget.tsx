"use client";

import { useCallback, useEffect, useState } from "react";
import { Col, Row } from "antd";
import httpClient from "@/infrastructure/http/httpClient";
import useAuthStore from "@/core/auth/authStore";
import { poolSubscribe } from "@/core/sse/ssePool";
import type { SSEEnvelope } from "@/core/sse/types";
import { KpiCard } from "@/components/widgets/KpiCard";
import { DataTable } from "@/components/widgets/DataTable";

const SSE_URL = process.env.NEXT_PUBLIC_SSE_URL ?? "/notifications/sse";

// ─── API response types ───────────────────────────────────────────────────────

interface Summary {
  tongLuotKham: number;
  tongDoanhThu: number;
  tongBhyt: number;
  tongBnTra: number;
  doanhThuTrungBinhTheoBenhNhan: number;
  doanhThuTrungBinhTheoTuan: number;
  tiLeBhytPct: number;
  khoaCaoNhat: { tenKhoa: string; soBenhNhan: number };
}

interface ChiTietRow {
  maKhoa: string;
  tenKhoa: string;
  soBenhNhan: number;
  tongThu: number;
  bhytTra: number;
  bnTra: number;
  haoPhiKhac: number;
}

// ─── SSE envelope payload ─────────────────────────────────────────────────────

interface BaoCaoSummaryPayload {
  tongLuotKham: number;
  tongDoanhThu: number;
  doanhThuTrungBinhTheoTuan: number;
  ngayBaoCao: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface BaoCaoKhoaWidgetProps {
  /** REST endpoint, mặc định "/m01/bao-cao/khoa" */
  apiPath?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("vi-VN");
}

// ─── Widget ──────────────────────────────────────────────────────────────────

export function BaoCaoKhoaWidget({
  apiPath = "/m01/bao-cao/khoa",
}: BaoCaoKhoaWidgetProps) {
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [chiTiet,  setChiTiet]  = useState<ChiTietRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const token = useAuthStore((s) => s.accessToken);

  // ── Fetch API — dùng lại được cho cả lần đầu lẫn khi SSE trigger ─────────
  const fetchData = useCallback(() => {
    httpClient
      .get<{ success: boolean; data: { summary: Summary; chiTiet: ChiTietRow[] } }>(apiPath)
      .then((res) => {
        setSummary(res.data.data.summary);
        setChiTiet(res.data.data.chiTiet);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiPath]);

  // ── Bước 1: gọi API lần đầu khi mount ────────────────────────────────────
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Bước 2: SSE — update KPI từ payload, sau đó re-fetch chiTiet ─────────
  useEffect(() => {
    if (!token) return;
    const url = `${SSE_URL}?access_token=${encodeURIComponent(token)}`;

    return poolSubscribe(
      url,
      "notification",
      (raw) => {
        const env = raw as SSEEnvelope<BaoCaoSummaryPayload>;
        if (env.type !== "bao_cao_khoa_summary") return;

        // Cập nhật KPI ngay từ SSE payload
        setSummary((prev) => {
          if (!prev) return prev;
          const newLuotKham = env.payload.tongLuotKham;
          const newDoanhThu = env.payload.tongDoanhThu;
          return {
            ...prev,
            tongLuotKham:                  newLuotKham,
            tongDoanhThu:                  newDoanhThu,
            doanhThuTrungBinhTheoTuan:     env.payload.doanhThuTrungBinhTheoTuan,
            doanhThuTrungBinhTheoBenhNhan: newLuotKham > 0
              ? Math.round(newDoanhThu / newLuotKham)
              : prev.doanhThuTrungBinhTheoBenhNhan,
          };
        });

        // Re-fetch API để cập nhật bảng chiTiet
        fetchData();
      },
      () => {},
    );
  }, [token, fetchData]);

  // ── Build table rows ──────────────────────────────────────────────────────
  const validRows = chiTiet.filter(
    (r) => r.maKhoa && r.maKhoa !== "string" && r.tenKhoa !== "string",
  );

  const totals = validRows.reduce(
    (acc, r) => ({
      soBenhNhan: acc.soBenhNhan + r.soBenhNhan,
      tongThu:    acc.tongThu    + r.tongThu,
      bhytTra:    acc.bhytTra    + r.bhytTra,
      bnTra:      acc.bnTra      + r.bnTra,
      haoPhiKhac: acc.haoPhiKhac + r.haoPhiKhac,
    }),
    { soBenhNhan: 0, tongThu: 0, bhytTra: 0, bnTra: 0, haoPhiKhac: 0 },
  );

  const tableData = [
    ...validRows.map((r) => ({
      maKhoa:  r.maKhoa,
      tenKhoa: r.tenKhoa,
      soBN:    r.soBenhNhan,
      tongThu: fmt(r.tongThu),
      bhytTra: fmt(r.bhytTra),
      bnTra:   fmt(r.bnTra),
      haoPhi:  r.haoPhiKhac > 0 ? fmt(r.haoPhiKhac) : "0",
    })),
    {
      maKhoa:  "",
      tenKhoa: "Tổng cộng",
      soBN:    totals.soBenhNhan,
      tongThu: fmt(totals.tongThu),
      bhytTra: fmt(totals.bhytTra),
      bnTra:   fmt(totals.bnTra),
      haoPhi:  "—",
    },
  ];

  const khoaCaoNhat = summary?.khoaCaoNhat;
  const tenKhoaShort = khoaCaoNhat?.tenKhoa.replace("Phòng khám ", "PK ") ?? "—";

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <KpiCard
            title="TỔNG LƯỢT KHÁM (SỐ BỆNH NHÂN)"
            value={summary ? `${summary.tongLuotKham} Bệnh nhân` : "—"}
            accent="#1677ff"
            hint={khoaCaoNhat ? `Khoa cao nhất: ${tenKhoaShort} — ${khoaCaoNhat.soBenhNhan} BN` : undefined}
            hintColor="#1677ff"
            loading={loading}
          />
        </Col>
        <Col span={8}>
          <KpiCard
            title="TỔNG DOANH THU (TỔNG THU)"
            value={summary ? `${fmt(summary.tongDoanhThu)} VND` : "—"}
            accent="#52c41a"
            hint={summary ? `BHYT: ${fmt(summary.tongBhyt)} · BN trả: ${fmt(summary.tongBnTra)}` : undefined}
            hintColor="#8c8c8c"
            loading={loading}
          />
        </Col>
        <Col span={8}>
          <KpiCard
            title="DOANH THU TRUNG BÌNH/BỆNH NHÂN"
            value={summary ? `${fmt(summary.doanhThuTrungBinhTheoBenhNhan)} VND` : "—"}
            accent="#722ed1"
            hint={summary ? `Tỉ lệ BHYT: ${summary.tiLeBhytPct}%` : undefined}
            hintColor="#8c8c8c"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Chi tiết table */}
      <DataTable
        title="Chi tiết dữ liệu theo khoa"
        exportButton
        summaryRowIndex={tableData.length - 1}
        loading={loading}
        columns={[
          { key: "maKhoa",  title: "MÃ KHOA",       color: "#1677ff" },
          { key: "tenKhoa", title: "TÊN KHOA/PHÒNG" },
          { key: "soBN",    title: "SỐ BN",         align: "right", color: "#1677ff" },
          { key: "tongThu", title: "TỔNG THU",      align: "right" },
          { key: "bhytTra", title: "BHYT TRẢ",      align: "right", color: "#52c41a" },
          { key: "bnTra",   title: "BN TRẢ",        align: "right", color: "#1677ff" },
          { key: "haoPhi",  title: "HAO PHÍ/KHÁC",  align: "right" },
        ]}
        data={tableData}
      />
    </div>
  );
}
