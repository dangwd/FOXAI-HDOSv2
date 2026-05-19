"use client";

import { Col, Row } from "antd";
import type { ScreenConfig } from "@/types/screen";
import { REGISTRY } from "@/components/registry";

interface Props {
  config: ScreenConfig;
}

export function ScreenRenderer({ config }: Props) {
  return (
    <div className="p-6 space-y-4">
      {config.title && (
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight">
              {config.title}
            </h1>
            {config.badge && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase leading-none"
                style={{
                  background: (config.badgeColor ?? '#52c41a') + '22',
                  color: config.badgeColor ?? '#52c41a',
                  border: `1px solid ${(config.badgeColor ?? '#52c41a')}55`,
                }}
              >
                {config.badge}
              </span>
            )}
          </div>
          {config.subtitle && (
            <p className="text-xs text-gray-400 dark:text-[#8b949e] m-0">{config.subtitle}</p>
          )}
        </div>
      )}
      {config.rows.map((row, rowIdx) => {
        const gutter = row.gutter ?? 16;
        const defaultSpan = Math.floor(24 / row.components.length);

        return (
          <Row key={rowIdx} gutter={[gutter, gutter]}>
            {row.components.map((comp, compIdx) => {
              const Component = REGISTRY[comp.type];

              if (!Component) {
                return (
                  <Col key={compIdx} span={comp.span ?? defaultSpan}>
                    <div className="p-3 rounded border border-dashed border-red-300 text-red-400 text-xs">
                      Widget chưa đăng ký: <code>{comp.type}</code>
                    </div>
                  </Col>
                );
              }

              return (
                <Col key={compIdx} span={comp.span ?? defaultSpan}>
                  <Component {...(comp.props ?? {})} />
                </Col>
              );
            })}
          </Row>
        );
      })}
    </div>
  );
}
