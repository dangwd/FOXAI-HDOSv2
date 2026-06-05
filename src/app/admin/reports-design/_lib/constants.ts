import type { WidgetCategory } from "@/infrastructure/http/adminApi";

export const CATEGORY_ORDER: WidgetCategory[] = [
  "visualization",
  "healthcare",
  "filter",
  "layout",
  "ai",
];

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  visualization: "Trực quan hóa",
  healthcare:    "Y tế",
  filter:        "Bộ lọc",
  layout:        "Bố cục",
  ai:            "AI",
};

export const CATEGORY_COLOR: Record<WidgetCategory, string> = {
  visualization: "blue",
  healthcare:    "green",
  filter:        "orange",
  layout:        "purple",
  ai:            "cyan",
};

// Default grid sizes for Screen Designer widget types
export const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  FormSection:        { w: 6,  h: 8 },
  TextBlock:          { w: 6,  h: 2 },
  Divider:            { w: 12, h: 1 },
  ImageBlock:         { w: 4,  h: 4 },
  ConditionalSection: { w: 6,  h: 6 },
};

export const WIDGET_TYPE_LABELS: Record<string, string> = {
  FormSection:        "Form Section",
  TextBlock:          "Text Block",
  Divider:            "Divider",
  ImageBlock:         "Image Block",
  ConditionalSection: "Conditional Section",
};

export const WIDGET_TYPE_DESCRIPTIONS: Record<string, string> = {
  FormSection:        "Nhúng một FormTemplate vào vị trí này",
  TextBlock:          "Tiêu đề hoặc đoạn văn bản (markdown)",
  Divider:            "Đường ngang phân cách các section",
  ImageBlock:         "Hình ảnh tĩnh từ URL",
  ConditionalSection: "Container ẩn/hiện theo giá trị field",
};
