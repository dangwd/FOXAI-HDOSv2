"use client";

import { REGISTRY } from "@/components/registry";
import type { ScreenConfig } from "@/types/screen";
import { Button, Col, Row } from "antd";

interface Props {
  config: ScreenConfig;
  loading?: boolean;
}

export function ScreenRenderer({ config, loading = false }: Props) {
  return (
    <div className="p-6 space-y-4">
      {config.title && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight">
                {config.title}
              </h1>
              {config.badge && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase leading-none"
                  style={{
                    background: (config.badgeColor ?? "#52c41a") + "22",
                    color: config.badgeColor ?? "#52c41a",
                    border: `1px solid ${config.badgeColor ?? "#52c41a"}55`,
                  }}
                >
                  {config.badge}
                </span>
              )}
              {config.live && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            {config.subtitle && (
              <p className="text-xs text-gray-400 dark:text-[#8b949e] m-0">
                {config.subtitle}
              </p>
            )}
          </div>

          {config.actions && config.actions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {config.actions.map((action, i) => (
                <Button
                  key={i}
                  type={
                    action.variant === "primary"
                      ? "primary"
                      : action.variant === "dashed"
                        ? "dashed"
                        : "default"
                  }
                  style={
                    action.color && action.variant !== "primary"
                      ? { borderColor: action.color, color: action.color }
                      : action.color && action.variant === "primary"
                        ? {
                            background: action.color,
                            borderColor: action.color,
                          }
                        : undefined
                  }
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      {config.rows.map((row, rowIdx) => {
        const gutter = row.gutter ?? 16;

        // Tính span cho từng component sao cho tổng luôn = 24
        const fixedSpan = row.components.reduce(
          (acc, c) => acc + (c.span ?? 0),
          0,
        );
        const autoCount = row.components.filter((c) => !c.span).length;
        const remaining = 24 - fixedSpan;
        const baseSpan = autoCount > 0 ? Math.floor(remaining / autoCount) : 0;
        const extraCount = autoCount > 0 ? remaining % autoCount : 0;
        let autoIdx = 0;

        const resolvedSpans = row.components.map((c) => {
          if (c.span) return c.span;
          const span = baseSpan + (autoIdx < extraCount ? 1 : 0);
          autoIdx++;
          return span;
        });

        return (
          <Row key={rowIdx} gutter={[gutter, gutter]}>
            {row.components.map((comp, compIdx) => {
              const Component = REGISTRY[comp.type];

              if (!Component) {
                return (
                  <Col key={compIdx} span={resolvedSpans[compIdx]}>
                    <div className="p-3 rounded border border-dashed border-red-300 text-red-400 text-xs">
                      Widget chưa đăng ký: <code>{comp.type}</code>
                    </div>
                  </Col>
                );
              }

              return (
                <Col key={compIdx} span={resolvedSpans[compIdx]}>
                  <Component {...(comp.props ?? {})} signalR={comp.signalR} loading={loading} />
                </Col>
              );
            })}
          </Row>
        );
      })}
    </div>
  );
}
