import type { DocumentType, FieldDataType, FieldPosition } from "@/infrastructure/http/ocrApi";

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  INVOICE:          "Hóa đơn",
  RECEIPT:          "Biên lai",
  CONTRACT:         "Hợp đồng",
  STATEMENT:        "Bảng kê",
  MINUTES:          "Biên bản",
  WAREHOUSE_RECEIPT:"Phiếu kho",
  OTHERS:           "Khác",
};

export const DOC_TYPE_COLORS: Record<DocumentType, string> = {
  INVOICE:          "blue",
  RECEIPT:          "green",
  CONTRACT:         "purple",
  STATEMENT:        "orange",
  MINUTES:          "cyan",
  WAREHOUSE_RECEIPT:"geekblue",
  OTHERS:           "default",
};

export const DOC_TYPE_OPTIONS = (Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map(
  (k) => ({ label: DOC_TYPE_LABELS[k], value: k }),
);

export const FIELD_DATA_TYPE_OPTIONS: { label: string; value: FieldDataType }[] = [
  { label: "Văn bản",    value: "TEXT" },
  { label: "Ngày tháng", value: "DATE" },
  { label: "Số",         value: "NUMBER" },
  { label: "Tiền tệ",    value: "CURRENCY" },
  { label: "Boolean",    value: "BOOLEAN" },
  { label: "Danh sách",  value: "LIST" },
];

export const FIELD_POSITION_OPTIONS: { label: string; value: FieldPosition }[] = [
  { label: "Đầu trang", value: "HEADER" },
  { label: "Nội dung",  value: "BODY" },
  { label: "Cuối trang", value: "FOOTER" },
];
