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
        <h1 className="text-xl font-semibold text-gray-800 m-0">{config.title}</h1>
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
