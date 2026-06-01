"use client";

import { Alert, Button, Input, Modal, Space, Tabs, Typography } from "antd";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { providerColor } from "../_lib/constants";
import type { Provider } from "../_lib/types";

const { Text } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSecret() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return (
    "rpf_live_" +
    Array.from(
      { length: 32 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("")
  );
}

function generateToken() {
  return (
    "bst_" +
    Array.from({ length: 48 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("")
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <Button
      size="small"
      icon={copied ? <Check size={13} /> : <Copy size={13} />}
      onClick={copy}
    >
      {copied ? "Đã sao!" : "Sao chép"}
    </Button>
  );
}

function SecretBox({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d]">
      <Text code className="!text-[11px] flex-1 break-all">
        {value}
      </Text>
      <CopyButton value={value} />
    </div>
  );
}

// ─── Tab: Secret ──────────────────────────────────────────────────────────────

function SecretTab({ provider }: { provider: Provider }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState<{
    secret: string;
    grace: number;
  } | null>(null);
  const [custom, setCustom] = useState("");
  const [customSaved, setCustomSaved] = useState(false);

  function handleRotate() {
    setRotating(true);
    setTimeout(() => {
      setRotated({ secret: generateSecret(), grace: 60 });
      setRotating(false);
    }, 800);
  }

  function handleReveal() {
    setTimeout(() => setRevealed(generateSecret()), 400);
  }

  function handleSetCustom() {
    if (!custom.trim()) return;
    setCustomSaved(true);
    setTimeout(() => setCustomSaved(false), 2000);
    setCustom("");
  }

  return (
    <div className="space-y-5">
      {/* Client ID */}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Client ID
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d]">
          <Text code className="flex-1">
            {provider.clientId}
          </Text>
          <CopyButton value={provider.clientId} />
        </div>
      </div>

      {/* Rotate */}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Rotate Secret
        </div>
        {rotated ? (
          <div className="space-y-2">
            <Alert
              type="warning"
              showIcon
              description={`Secret cũ vẫn hoạt động trong ${rotated.grace}s. Cập nhật config provider ngay.`}
            />
            <SecretBox value={rotated.secret} />
          </div>
        ) : (
          <Space.Compact className="w-full">
            <div className="flex-1 px-3 py-2 rounded-l-lg bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] border-r-0">
              <span className="text-gray-300 dark:text-[#30363d] font-mono">
                ● ● ● ● ● ● ● ● ● ● ● ●
              </span>
            </div>
            <Button
              type="primary"
              loading={rotating}
              icon={<RefreshCw size={13} />}
              onClick={handleRotate}
            >
              Rotate
            </Button>
            <Button
              icon={revealed ? <EyeOff size={13} /> : <Eye size={13} />}
              onClick={handleReveal}
            >
              {revealed ? "Ẩn" : "Reveal"}
            </Button>
          </Space.Compact>
        )}
        {revealed && !rotated && (
          <div className="mt-2">
            <SecretBox value={revealed} />
          </div>
        )}
      </div>

      {/* Set custom */}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Đặt Secret tùy chỉnh
        </div>
        <Space.Compact className="w-full">
          <Input.Password
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Nhập secret mới..."
            className="flex-1"
          />
          <Button
            disabled={!custom.trim()}
            icon={customSaved ? <Check size={13} /> : undefined}
            onClick={handleSetCustom}
          >
            {customSaved ? "Đã lưu" : "Lưu"}
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
}

// ─── Tab: Bootstrap token ─────────────────────────────────────────────────────

function BootstrapTab() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fetchToken() {
    setLoading(true);
    setTimeout(() => {
      setToken(generateToken());
      setLoading(false);
    }, 600);
  }

  function regenerate() {
    setToken(null);
    setLoading(true);
    setTimeout(() => {
      setToken(generateToken());
      setLoading(false);
    }, 600);
  }

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        description={
          <>
            Bootstrap token dùng để provider lấy client secret lần đầu khởi
            động. Provider gọi{" "}
            <Text code>POST /api/v1/providers/bootstrap</Text> với token này.
          </>
        }
      />

      {token ? (
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Bootstrap Token (one-time)
          </div>
          <SecretBox value={token} />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/60 dark:bg-[#0d1117]/60">
          <Key size={20} className="text-gray-400 shrink-0" />
          <p className="text-sm text-gray-400 m-0">
            Token chưa được tạo hoặc đã sử dụng
          </p>
        </div>
      )}

      <Space>
        {!token && (
          <Button type="primary" loading={loading} onClick={fetchToken}>
            Xem token
          </Button>
        )}
        <Button
          icon={<RefreshCw size={13} />}
          loading={loading}
          onClick={regenerate}
        >
          Regenerate
        </Button>
      </Space>
    </div>
  );
}

// ─── Tab: Revoke ──────────────────────────────────────────────────────────────

function RevokeTab({
  provider,
  onRevoke,
}: {
  provider: Provider;
  onRevoke: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [revoking, setRevoking] = useState(false);

  function handleRevoke() {
    if (confirmText !== provider.providerId) return;
    setRevoking(true);
    setTimeout(() => {
      setRevoking(false);
      onRevoke();
    }, 800);
  }

  return (
    <div className="space-y-4">
      <Alert
        type="error"
        showIcon
        title="Vô hiệu hóa toàn bộ credentials"
        description="Tất cả JWT token đang hoạt động sẽ bị từ chối ngay lập tức. Provider sẽ không thể kết nối đến bridge cho đến khi credentials được thiết lập lại."
      />

      <div>
        <div className="text-[11px] font-semibold text-gray-500 mb-1.5">
          Nhập{" "}
          <Text code className="text-red-500">
            {provider.providerId}
          </Text>{" "}
          để xác nhận:
        </div>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={provider.providerId}
          status={
            confirmText && confirmText !== provider.providerId
              ? "error"
              : undefined
          }
        />
      </div>

      <Button
        danger
        type="primary"
        block
        loading={revoking}
        disabled={confirmText !== provider.providerId}
        icon={<AlertTriangle size={14} />}
        onClick={handleRevoke}
      >
        {revoking ? "Đang revoke..." : "Revoke Credentials"}
      </Button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CredentialsModal({
  provider,
  onRevoke,
  onClose,
}: {
  provider: Provider;
  onRevoke: () => void;
  onClose: () => void;
}) {
  const color = providerColor(provider.providerId);
  const initials = provider.providerId
    .split("-")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const title = (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={{ background: color }}
      >
        {initials}
      </div>
      <div>
        <div className="text-sm font-bold">Credentials</div>
        <div className="text-[11px] font-normal text-gray-400">
          {provider.displayName}
        </div>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: "secret",
      label: "Client Secret",
      children: <SecretTab provider={provider} />,
    },
    {
      key: "bootstrap",
      label: "Bootstrap Token",
      children: <BootstrapTab />,
    },
    {
      key: "revoke",
      label: (
        <span className="flex items-center gap-1 text-red-500">
          <AlertTriangle size={12} />
          Revoke
        </span>
      ),
      children: (
        <RevokeTab
          provider={provider}
          onRevoke={() => {
            onRevoke();
            onClose();
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      open
      onCancel={onClose}
      title={title}
      footer={<Button onClick={onClose}>Đóng</Button>}
      width={520}
    >
      <Tabs items={tabItems} />
    </Modal>
  );
}
