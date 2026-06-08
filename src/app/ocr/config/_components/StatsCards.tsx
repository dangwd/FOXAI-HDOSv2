"use client";

import { Typography, theme } from "antd";
import { CheckCircle, FileText, Layers, Table2 } from "lucide-react";
import type { OcrSchemaStats } from "@/infrastructure/http/ocrApi";
import type { LucideIcon } from "lucide-react";

const { Text } = Typography;

interface CardDef {
  key:   keyof OcrSchemaStats;
  label: string;
  Icon:  LucideIcon;
  hex:   string;   // accent color hex
  rgb:   string;   // accent color as "r,g,b" for rgba()
}

const CARDS: CardDef[] = [
  { key: "totalSchemas",  label: "Tổng schema",          Icon: Layers,       hex: "#3b82f6", rgb: "59,130,246"  },
  { key: "activeSchemas", label: "Đang hoạt động",       Icon: CheckCircle,  hex: "#10b981", rgb: "16,185,129"  },
  { key: "totalFields",   label: "Tổng trường dữ liệu",  Icon: FileText,     hex: "#8b5cf6", rgb: "139,92,246"  },
  { key: "totalTables",   label: "Tổng bảng dữ liệu",    Icon: Table2,       hex: "#f97316", rgb: "249,115,22"  },
];

export function StatsCards({ stats, loading }: { stats: OcrSchemaStats | null; loading: boolean }) {
  const { token } = theme.useToken();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, Icon, hex, rgb }) => (
        <div
          key={key}
          style={{
            position:     "relative",
            borderRadius: token.borderRadiusLG,
            border:       `1px solid rgba(${rgb},0.22)`,
            background:   `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(${rgb},0.03) 60%, transparent 100%)`,
            padding:      "18px 20px",
            overflow:     "hidden",
          }}
        >
          {/* Decorative orb */}
          <div style={{
            position:     "absolute",
            right:        -20,
            bottom:       -20,
            width:        80,
            height:       80,
            borderRadius: "50%",
            background:   `rgba(${rgb},0.07)`,
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            {/* Left: label + value */}
            <div>
              <Text style={{
                fontSize:      11,
                fontWeight:    600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color:         token.colorTextTertiary,
                display:       "block",
                marginBottom:  10,
              }}>
                {label}
              </Text>

              {loading ? (
                <div style={{
                  height:       32,
                  width:        56,
                  borderRadius: token.borderRadius,
                  background:   token.colorFillSecondary,
                }} />
              ) : (
                <div style={{
                  fontSize:           30,
                  fontWeight:         700,
                  lineHeight:         1,
                  color:              token.colorText,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {stats?.[key] ?? 0}
                </div>
              )}
            </div>

            {/* Right: icon */}
            <div style={{
              width:          36,
              height:         36,
              borderRadius:   token.borderRadius,
              background:     `rgba(${rgb},0.12)`,
              border:         `1px solid rgba(${rgb},0.2)`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              marginLeft:     12,
            }}>
              <Icon size={16} style={{ color: hex }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
