"use client";

import { useState } from "react";
import { Alert, Button, Divider, Drawer, Form, Input } from "antd";
import { Layers } from "lucide-react";
import type { ModuleForm } from "../_lib/types";

const BLANK: ModuleForm = { code: "", name: "", description: "" };

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-[13px] font-semibold text-gray-700 dark:text-[#c9d1d9]">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

export function ModuleFormDrawer({
  open,
  onSubmit,
  onClose,
  submitting,
  submitError,
}: {
  open:         boolean;
  onSubmit:     (f: ModuleForm) => Promise<void>;
  onClose:      () => void;
  submitting?:  boolean;
  submitError?: string | null;
}) {
  const [form, setForm] = useState<ModuleForm>(BLANK);

  function handleClose() {
    setForm(BLANK);
    onClose();
  }

  async function handleSubmit() {
    await onSubmit(form);
    setForm(BLANK);
  }

  const canSubmit = !!form.code.trim() && !!form.name.trim();

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Layers size={14} className="text-emerald-600" />
          </div>
          <span>Tạo Module mới</span>
        </div>
      }
      styles={{
        wrapper: { width: 480 },
        body: { padding: "24px 24px 0" },
      }}
      footer={
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400 dark:text-[#484f58]">
            {canSubmit ? "Sẵn sàng tạo" : "Điền đầy đủ thông tin bắt buộc"}
          </span>
          <div className="flex gap-2">
            <Button onClick={handleClose}>Hủy</Button>
            <Button
              type="primary"
              disabled={!canSubmit || submitting}
              loading={submitting}
              onClick={handleSubmit}
            >
              Tạo Module
            </Button>
          </div>
        </div>
      }
    >
      {submitError && (
        <Alert type="error" message={submitError} className="mb-5" showIcon />
      )}

      <Form layout="vertical" component="div" requiredMark={false} size="large">
        <Form.Item label={<FieldLabel text="Code" required />} className="mb-5">
          <Input
            value={form.code}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              }))
            }
            placeholder="vd: benh-nhan, lich-kham"
            maxLength={50}
            className="font-mono"
          />
          <div className="mt-2 flex items-start gap-1.5">
            <span className="text-[11px] text-gray-400 dark:text-[#484f58] mt-px">→</span>
            <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 leading-relaxed">
              Chỉ dùng chữ thường, số và dấu <code className="bg-gray-100 dark:bg-[#1f2937] px-1 rounded">-</code>.
              {form.code && (
                <span className="ml-1">
                  Module sẽ có code{" "}
                  <code className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1 rounded">
                    {form.code}
                  </code>
                </span>
              )}
            </p>
          </div>
        </Form.Item>

        <Form.Item label={<FieldLabel text="Tên module" required />} className="mb-5">
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="vd: Quản lý bệnh nhân"
            maxLength={200}
          />
        </Form.Item>

        <Divider className="my-5" plain>
          <span className="text-[11px] text-gray-400 dark:text-[#484f58] font-normal">Tuỳ chọn</span>
        </Divider>

        <Form.Item label={<FieldLabel text="Mô tả" />} className="mb-5">
          <Input.TextArea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả ngắn gọn về module này…"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
