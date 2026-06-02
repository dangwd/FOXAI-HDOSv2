"use client";

import { useState } from "react";
import { Alert, Button, Drawer, Form, Input, Space } from "antd";
import type { ModuleForm } from "../_lib/types";

const BLANK: ModuleForm = { code: "", name: "", description: "" };

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

  const footer = (
    <div className="flex justify-end">
      <Space>
        <Button onClick={handleClose}>Hủy</Button>
        <Button
          type="primary"
          disabled={!canSubmit || submitting}
          loading={submitting}
          onClick={handleSubmit}
        >
          Tạo Module
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Tạo Module mới"
      styles={{ wrapper: { width: 480 } }}
      footer={footer}
    >
      <Form layout="vertical" component="div">
        {submitError && (
          <Alert type="error" message={submitError} className="mb-4" showIcon />
        )}

        <Form.Item
          label="Code"
          required
          help="Chỉ gồm chữ thường, số và dấu gạch ngang (a-z0-9-). Tối đa 50 ký tự."
        >
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
          />
        </Form.Item>

        <Form.Item label="Tên module" required>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="vd: Bệnh nhân"
            maxLength={200}
          />
        </Form.Item>

        <Form.Item label="Mô tả">
          <Input.TextArea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả ngắn gọn về module này…"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
