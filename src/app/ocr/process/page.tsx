"use client";

import {
  getDocumentSseUrl,
  normalizeDocument,
  ocrApi,
  type DocLineItem,
  type OcrDocument,
  type OcrSchema,
} from "@/infrastructure/http/ocrApi";
import type { UploadFile } from "antd";
import {
  Alert,
  App,
  Button,
  Input,
  Progress,
  Select,
  Spin,
  Table,
  Tag,
  Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircle2,
  ChevronLeft,
  FileText,
  Save,
  ScanLine,
  Table2,
  ThumbsUp,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_MODELS = [
  { value: "gemini", label: "Gemini 2.5 Flash" },
  { value: "claude", label: "Claude Sonnet" },
  { value: "local-pdf", label: "Local PDF" },
  { value: "mock", label: "Mock (Test)" },
];

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.tiff,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx";

const STATUS_CONFIG = {
  DRAFT: { label: "Nháp", color: "default" },
  PROCESSED: { label: "Đã xử lý", color: "blue" },
  CONFIRMED: { label: "Đã xác nhận", color: "green" },
  TRANSFERRED: { label: "Đã chuyển", color: "purple" },
  ERROR: { label: "Lỗi", color: "red" },
} as const;

type OcrPhase =
  | "idle"
  | "uploading"
  | "queued"
  | "processing"
  | "done"
  | "failed";

// ─── File preview pane ────────────────────────────────────────────────────────

function FilePreviewPane({ file }: { file: UploadFile | null }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [htmlDoc, setHtmlDoc] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlobUrl(null);
    setHtmlDoc(null);
    setConverting(false);
    if (!file) return;

    const raw =
      (file as UploadFile & { originFileObj?: File }).originFileObj ??
      (file as unknown as File);
    const mime = ((file as unknown as { type?: string }).type ?? "").toLowerCase();
    const name = (file.name ?? "").toLowerCase();

    const isImage = mime.startsWith("image/");
    const isPdf   = mime === "application/pdf" || name.endsWith(".pdf");
    const isWord  = mime.includes("wordprocessingml") || mime === "application/msword"
                    || name.endsWith(".docx") || name.endsWith(".doc");
    const isSheet = mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel"
                    || mime === "text/csv"
                    || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv");

    if (isImage || isPdf) {
      const url = URL.createObjectURL(raw);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (isWord || isSheet) {
      setConverting(true);
      let cancelled = false;

      (async () => {
        try {
          const buf = await raw.arrayBuffer();
          if (cancelled) return;

          let html = "";
          if (isWord) {
            // mammoth: DOCX → HTML
            const mod = await import("mammoth");
            const mammoth = (mod as unknown as { default?: typeof mod }).default ?? mod;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (mammoth as any).convertToHtml({ arrayBuffer: buf });
            html = `<style>
              body{font-family:sans-serif;font-size:13px;line-height:1.6;padding:16px;color:#1a1a1a}
              img{max-width:100%}
              table{border-collapse:collapse;width:100%}
              td,th{border:1px solid #ccc;padding:4px 8px}
            </style>${result.value as string}`;
          } else {
            // SheetJS: XLSX / XLS / CSV → HTML table
            const XLSX = await import("xlsx");
            const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const table = XLSX.utils.sheet_to_html(ws);
            html = `<style>
              body{font-family:sans-serif;font-size:12px;padding:8px;margin:0;overflow:auto}
              table{border-collapse:collapse;width:max-content;min-width:100%}
              td,th{border:1px solid #d0d7de;padding:3px 10px;white-space:nowrap}
              tr:first-child td,tr:first-child th{background:#f6f8fa;font-weight:600}
              tr:nth-child(even) td{background:#f9f9f9}
            </style>${table}`;
          }

          if (!cancelled) { setHtmlDoc(html); setConverting(false); }
        } catch {
          if (!cancelled) setConverting(false);
        }
      })();

      return () => { cancelled = true; };
    }
  }, [file]);

  const mime = ((file as unknown as { type?: string })?.type ?? "").toLowerCase();

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
          <FileText size={28} className="text-gray-300 dark:text-[#30363d]" />
        </div>
        <p className="text-xs text-gray-400 dark:text-[#484f58]">Chưa chọn tài liệu</p>
      </div>
    );
  }

  if (converting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Spin size="default" />
        <p className="text-xs text-gray-400 dark:text-[#484f58]">Đang tải xem trước...</p>
      </div>
    );
  }

  if (blobUrl && mime.startsWith("image/")) {
    return (
      <div className="w-full h-full flex items-start justify-center overflow-auto p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={blobUrl} alt="preview" className="max-w-full object-contain rounded shadow-sm" />
      </div>
    );
  }

  if (blobUrl && (mime === "application/pdf" || (file.name ?? "").toLowerCase().endsWith(".pdf"))) {
    return <iframe src={blobUrl} title="PDF preview" className="w-full h-full border-0" />;
  }

  if (htmlDoc) {
    return (
      <iframe
        srcDoc={htmlDoc}
        title="Document preview"
        className="w-full h-full border-0 bg-white"
        sandbox="allow-same-origin"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
        <FileText size={28} className="text-violet-500" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-[#e6edf3] text-center break-all">
        {file.name}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-[#484f58]">
        Không thể xem trước định dạng này
      </p>
    </div>
  );
}

// ─── Confidence dot ───────────────────────────────────────────────────────────

function ConfidenceDot({ value }: { value: number }) {
  const color =
    value >= 0.85
      ? "bg-green-400"
      : value >= 0.6
        ? "bg-yellow-400"
        : "bg-red-400";
  return (
    <span
      title={`Độ tin cậy: ${Math.round(value * 100)}%`}
      className={`inline-block w-1.5 h-1.5 rounded-full ${color} ml-1.5 shrink-0`}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function OcrProcessInner() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const schemaId = searchParams.get("schema");

  const [schema, setSchema] = useState<OcrSchema | null>(null);
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState("gemini");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [phase, setPhase] = useState<OcrPhase>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [document, setDocument] = useState<OcrDocument | null>(null);

  // Editable field values — keyed by fieldKey
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const esRef = useRef<EventSource | null>(null);

  // ── Load schema ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!schemaId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    ocrApi
      .getSchema(schemaId)
      .then(setSchema)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schemaId]);

  // ── Cleanup SSE on unmount ────────────────────────────────────────────────
  useEffect(
    () => () => {
      esRef.current?.close();
    },
    [],
  );

  // ── Populate editable field values when document loads ────────────────────
  useEffect(() => {
    if (!document) return;
    const map: Record<string, string> = {};
    for (const v of (document.values ?? [])) map[v.fieldKey] = v.value;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFieldValues(map);
  }, [document]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const allFields = useMemo(
    () =>
      (schema?.fields ?? []).sort((a, b) => a.displayOrder - b.displayOrder),
    [schema],
  );

  const tables = schema?.tables ?? [];

  const lineItemsByTable = useMemo(() => {
    const map = new Map<string, DocLineItem[]>();
    if (!document) return map;
    for (const item of (document.lineItems ?? [])) {
      const arr = map.get(item.tableKey) ?? [];
      arr.push(item);
      map.set(item.tableKey, arr);
    }
    return map;
  }, [document]);

  // ── SSE ──────────────────────────────────────────────────────────────────
  // Backend sends unnamed SSE events; payload: { type, document?, progress?, reason? }
  // The "done" event includes the full document inline — use it directly to
  // avoid an extra round-trip and any stale-read race.
  const startSse = useCallback((documentId: string) => {
    esRef.current?.close();
    const es = new EventSource(getDocumentSseUrl(documentId));
    esRef.current = es;
    let completed = false;

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const raw = JSON.parse(e.data) as Record<string, unknown>;
        const type = raw.type as string | undefined;

        if (type === "progress") {
          setPhase("processing");
          setOcrProgress((raw.progress as number) ?? 0);
        } else if (type === "done") {
          completed = true;
          setOcrProgress(100);
          const inlineDoc = raw.document ? normalizeDocument(raw.document) : undefined;
          if (inlineDoc) {
            setDocument(inlineDoc);
            setPhase("done");
          } else {
            const docId = (raw.documentId as string | undefined) ?? documentId;
            ocrApi
              .getDocument(docId)
              .then((doc) => {
                setDocument(doc);
                setPhase("done");
              })
              .catch(() => {
                setOcrError("OCR xong nhưng không tải được kết quả.");
                setPhase("failed");
              });
          }
          es.close();
        } else if (type === "failed") {
          completed = true;
          // API sends { error: "..." } — fallback to reason for compatibility
          setOcrError((raw.error as string | undefined) ?? (raw.reason as string | undefined) ?? "OCR thất bại");
          setPhase("failed");
          es.close();
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      // CONNECTING = auto-reconnect in progress — wait it out.
      // If done/failed already handled, don't override.
      if (completed || es.readyState === EventSource.CONNECTING) return;
      setOcrError("Mất kết nối theo dõi OCR.");
      setPhase("failed");
    };
  }, []);

  // ── Upload + start OCR ────────────────────────────────────────────────────
  async function handleStartOcr() {
    if (!fileList.length || !schema) return;

    const raw =
      (fileList[0] as UploadFile & { originFileObj?: File }).originFileObj ??
      (fileList[0] as unknown as File);

    const formData = new FormData();
    formData.append("files", raw);
    formData.append("schemaId", schema.id);
    formData.append("ocrProvider", provider);
    formData.append("language", "vi+en");

    try {
      setPhase("uploading");
      setOcrError(null);
      setDocument(null);
      setFieldValues({});
      setOcrProgress(0);

      const res = await ocrApi.uploadDocuments(formData);
      setPhase("queued");
      startSse(res.documentId);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "Upload thất bại");
      setPhase("failed");
    }
  }

  // ── Save edits ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!document) return;
    setSaving(true);
    try {
      // API expects { fieldId, stringValue } — look up fieldId from the loaded document values
      const updated = await ocrApi.updateDocument(document.id, {
        values: Object.entries(fieldValues).map(([fieldKey, stringValue]) => {
          const docVal = document.values.find((v) => v.fieldKey === fieldKey);
          return { fieldId: docVal?.fieldId ?? "", stringValue };
        }),
      });
      setDocument(updated);
      message.success("Đã lưu thay đổi");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!document) return;
    setConfirming(true);
    try {
      const updated = await ocrApi.confirmDocument(document.id);
      setDocument(updated);
      message.success("Đã xác nhận chứng từ");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Xác nhận thất bại");
    } finally {
      setConfirming(false);
    }
  }

  function handleReset() {
    esRef.current?.close();
    setFileList([]);
    setDocument(null);
    setFieldValues({});
    setPhase("idle");
    setOcrProgress(0);
    setOcrError(null);
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!schemaId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#010409]">
        <p className="text-sm text-gray-400 dark:text-[#8b949e]">
          Vui lòng chọn một schema từ menu.
        </p>
      </div>
    );
  }

  const isRunning =
    phase === "uploading" || phase === "queued" || phase === "processing";
  const canStart = fileList.length > 0 && !isRunning && phase !== "done";
  const isDone = phase === "done" && !!document;
  const canEdit =
    isDone && (document.status === "DRAFT" || document.status === "PROCESSED");
  const canConfirm = isDone && document.status === "PROCESSED";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#0d1117]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200 dark:border-[#30363d] px-6 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3] mb-2 transition-colors"
        >
          <ChevronLeft size={13} />
          Nhận dạng OCR
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <ScanLine
              size={15}
              className="text-violet-600 dark:text-violet-400"
            />
          </div>
          {loading ? (
            <Spin size="small" />
          ) : schema ? (
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900 dark:text-[#e6edf3] m-0">
                {schema.name}
              </h1>
              <Tag color="purple" className="font-mono text-[11px]">
                {schema.code}
              </Tag>
              {document && (
                <Tag
                  color={STATUS_CONFIG[document.status]?.color ?? "default"}
                  className="text-[11px]"
                >
                  {STATUS_CONFIG[document.status]?.label ?? document.status}
                </Tag>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500 dark:text-[#8b949e]">
              {schemaId}
            </span>
          )}

          {/* Action buttons — top right */}
          {isDone && (
            <div className="ml-auto flex items-center gap-2">
              {canEdit && (
                <Button
                  icon={<Save size={13} />}
                  size="small"
                  loading={saving}
                  onClick={handleSave}
                >
                  Lưu
                </Button>
              )}
              {canConfirm && (
                <Button
                  type="primary"
                  icon={<ThumbsUp size={13} />}
                  size="small"
                  loading={confirming}
                  onClick={handleConfirm}
                >
                  Xác nhận
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Split panel ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: file preview */}
        <div className="w-[42%] shrink-0 border-r border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#010409] flex flex-col">
          {/* File name bar */}
          {fileList[0] && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-[#21262d] shrink-0">
              <FileText size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-[#8b949e] truncate flex-1">
                {fileList[0].name}
              </span>
              {phase !== "done" && (
                <button
                  onClick={() => {
                    setFileList([]);
                    setPhase("idle");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <FilePreviewPane file={fileList[0] ?? null} />
          </div>
        </div>

        {/* Right: controls + data */}
        <div className="flex-1 overflow-y-auto">
          {/* Upload zone */}
          <div className="p-5 border-b border-gray-100 dark:border-[#21262d]">
            {phase === "done" ? (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <CheckCircle2
                    size={15}
                    className="text-green-600 dark:text-green-400"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-[#e6edf3] m-0 truncate">
                    {fileList[0]?.name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 m-0">
                    Nhận dạng hoàn tất
                    {document?.confidence != null && (
                      <span className="ml-1.5 text-gray-400 dark:text-[#484f58]">
                        · Độ tin cậy {Math.round(document.confidence * 100)}%
                      </span>
                    )}
                  </p>
                </div>
                <Button size="small" onClick={handleReset}>
                  Tải file mới
                </Button>
              </div>
            ) : (
              <Upload.Dragger
                accept={ACCEPT}
                multiple={false}
                showUploadList={false}
                disabled={isRunning}
                beforeUpload={(file) => {
                  setFileList([file as unknown as UploadFile]);
                  setDocument(null);
                  setFieldValues({});
                  setPhase("idle");
                  setOcrError(null);
                  return false;
                }}
                className="border-dashed! border-gray-200! dark:border-[#30363d]! bg-gray-50! dark:bg-[#161b22]! hover:border-violet-400! dark:hover:border-violet-600! rounded-xl!"
              >
                {fileList.length > 0 ? (
                  <div className="py-4 flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <FileText size={16} className="text-violet-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-[#e6edf3] max-w-xs truncate">
                      {fileList[0].name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Click hoặc kéo thả để đổi file
                    </p>
                  </div>
                ) : (
                  <div className="py-5 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <UploadCloud size={18} className="text-violet-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-[#e6edf3]">
                      Kéo thả hoặc click để chọn tệp
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-[#8b949e]">
                      PDF · PNG · JPG · TIFF · Excel · CSV · Word · tối đa 25 MB
                    </p>
                  </div>
                )}
              </Upload.Dragger>
            )}

            {/* Model selector + trigger */}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-gray-500 dark:text-[#8b949e] shrink-0">
                Model AI
              </span>
              <Select
                value={provider}
                onChange={setProvider}
                size="small"
                options={AI_MODELS}
                disabled={isRunning || phase === "done"}
                className="w-44"
              />
              <div className="ml-auto">
                {canStart && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<ScanLine size={12} />}
                    onClick={handleStartOcr}
                  >
                    Bắt đầu nhận dạng
                  </Button>
                )}
              </div>
            </div>

            {ocrError && (
              <div className="py-2 w-full">
                <Alert
                  type="error"
                  title={ocrError}
                  showIcon
                  closable
                  onClose={() => {
                    setOcrError(null);
                    if (phase === "failed") setPhase("idle");
                  }}
                  className="mt-3"
                />
              </div>
            )}
          </div>

          {/* Progress */}
          {(phase === "queued" || phase === "processing") && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#21262d]">
              <div className="flex items-center gap-2 mb-2">
                <Spin size="small" />
                <span className="text-sm text-gray-600 dark:text-[#8b949e]">
                  {phase === "queued"
                    ? "Đang xếp hàng chờ xử lý..."
                    : "Đang nhận dạng tài liệu..."}
                </span>
                <span className="ml-auto text-xs font-semibold text-violet-600 dark:text-violet-400">
                  {ocrProgress}%
                </span>
              </div>
              <Progress
                percent={ocrProgress}
                showInfo={false}
                strokeColor="#7c3aed"
                trailColor="var(--color-gray-100, #f3f4f6)"
              />
            </div>
          )}

          {/* Fields */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spin size="large" />
            </div>
          ) : allFields.length > 0 ? (
            <div className="p-5 border-b border-gray-100 dark:border-[#21262d]">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={13} className="text-violet-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-[#e6edf3]">
                  Trường dữ liệu
                </span>
                <span className="text-[11px] text-gray-400 dark:text-[#8b949e] bg-gray-100 dark:bg-[#21262d] px-2 py-0.5 rounded ml-1">
                  {allFields.length} trường
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                {allFields.map((field) => {
                  const docVal = document?.values.find(
                    (v) => v.fieldKey === field.fieldKey,
                  );
                  const currentVal = fieldValues[field.fieldKey] ?? "";
                  return (
                    <div key={field.id}>
                      <label className="flex items-center gap-1 text-[12px] font-medium text-gray-500 dark:text-[#8b949e] mb-1.5">
                        {field.label}
                        {field.isRequired && (
                          <span className="text-red-400 ml-0.5">*</span>
                        )}
                        <span className="font-mono text-[10px] text-gray-300 dark:text-[#30363d] ml-1">
                          {field.fieldKey}
                        </span>
                        {docVal && <ConfidenceDot value={docVal.confidence} />}
                      </label>
                      {canEdit ? (
                        <Input
                          size="small"
                          value={currentVal}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [field.fieldKey]: e.target.value,
                            }))
                          }
                          placeholder={field.dataType}
                          className={
                            docVal && docVal.confidence < 0.6
                              ? "border-yellow-300!"
                              : ""
                          }
                        />
                      ) : (
                        <div
                          className={`min-h-[30px] rounded-md border px-3 py-1.5 flex items-center
                            ${
                              currentVal
                                ? "bg-white dark:bg-[#0d1117] border-violet-200 dark:border-violet-800/50"
                                : "bg-gray-50 dark:bg-[#161b22] border-gray-200 dark:border-[#30363d]"
                            }`}
                        >
                          {currentVal ? (
                            <span className="text-xs text-gray-800 dark:text-[#e6edf3]">
                              {currentVal}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-[#484f58] italic">
                              {field.dataType}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Tables */}
          {tables.map((table) => {
            const cols = [...table.columns].sort(
              (a, b) => a.displayOrder - b.displayOrder,
            );
            const items = lineItemsByTable.get(table.tableKey) ?? [];

            // Flatten nested values for Ant Design Table
            const rows = items.map((item, i) => ({ __k: String(i), ...item.values })) as Record<
              string,
              string
            >[];

            const columns: ColumnsType<Record<string, string>> = [
              {
                title: "STT",
                key: "_stt",
                width: 52,
                align: "center" as const,
                render: (_v, _r, idx) => (
                  <span className="text-xs text-gray-400 dark:text-[#484f58]">
                    {idx + 1}
                  </span>
                ),
              },
              ...cols.map((col) => ({
                title: col.label,
                key: col.columnKey,
                dataIndex: col.columnKey,
                render: (v: string) => (
                  <span className="text-xs text-gray-700 dark:text-[#c9d1d9]">
                    {v ?? ""}
                  </span>
                ),
              })),
            ];

            return (
              <div
                key={table.id}
                className="border-b border-gray-100 dark:border-[#21262d] last:border-0"
              >
                <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                  <Table2 size={13} className="text-violet-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-[#e6edf3]">
                    {table.name}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[11px] text-gray-400 dark:text-[#8b949e] bg-gray-100 dark:bg-[#21262d] px-2 py-0.5 rounded">
                      {items.length} dòng
                    </span>
                  )}
                </div>
                <div className="px-5 pb-4">
                  <Table<Record<string, string>>
                    dataSource={rows}
                    columns={columns}
                    rowKey="__k"
                    pagination={false}
                    size="small"
                    locale={{
                      emptyText: (
                        <div className="py-6 text-xs text-gray-400 dark:text-[#484f58]">
                          Bảng sẽ hiển thị sau khi nhận dạng
                        </div>
                      ),
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Empty schema */}
          {!loading &&
            allFields.length === 0 &&
            tables.length === 0 &&
            schema && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm text-gray-400 dark:text-[#484f58]">
                  Schema này chưa có trường dữ liệu hoặc bảng chi tiết.
                </p>
              </div>
            )}

          {/* Bottom action bar — visible only when can save/confirm */}
          {isDone && (canEdit || canConfirm) && (
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-5 py-3 bg-white dark:bg-[#0d1117] border-t border-gray-200 dark:border-[#30363d]">
              {canEdit && (
                <Button
                  icon={<Save size={13} />}
                  loading={saving}
                  onClick={handleSave}
                >
                  Lưu thay đổi
                </Button>
              )}
              {canConfirm && (
                <Button
                  type="primary"
                  icon={<ThumbsUp size={13} />}
                  loading={confirming}
                  onClick={handleConfirm}
                >
                  Xác nhận chứng từ
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OcrProcessPage() {
  return (
    <Suspense fallback={null}>
      <OcrProcessInner />
    </Suspense>
  );
}
