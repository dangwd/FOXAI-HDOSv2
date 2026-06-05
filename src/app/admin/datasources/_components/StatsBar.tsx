import { Divider, Statistic } from "antd";
import type { SourceProfile } from "../_lib/types";

// Dùng Ant Design Statistic để màu text lấy từ ConfigProvider token — không phụ thuộc Tailwind dark:

export function StatsBar({ profiles }: { profiles: SourceProfile[] }) {
  const systems   = new Set(profiles.map((p) => p.sourceSystem)).size;
  const types     = new Set(profiles.map((p) => p.recordType)).size;
  const totalMaps = profiles.reduce((acc, p) => acc + Object.keys(p.mappings).length, 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Statistic title="Profiles"      value={profiles.length} />
      <Divider type="vertical" style={{ height: 40 }} />
      <Statistic title="Nguồn"         value={systems} />
      <Divider type="vertical" style={{ height: 40 }} />
      <Statistic title="Loại tài liệu" value={types} />
      <Divider type="vertical" style={{ height: 40 }} />
      <Statistic
        title="Mappings"
        value={totalMaps}
        valueStyle={{ color: "#34d399" }}
      />
    </div>
  );
}
