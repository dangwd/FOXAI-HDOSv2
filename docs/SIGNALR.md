# SignalR — Hướng dẫn sử dụng

Mỗi widget trên màn hình có thể kết nối một SignalR hub **độc lập**. Khi một kết nối lỗi, các widget còn lại không bị ảnh hưởng.

---

## Cách hoạt động

```
Backend (ScreenConfig JSON)
  └─ ComponentConfig.signalR = { hubUrl, methodName }
        ↓
ScreenRenderer truyền signalR xuống props
        ↓
Widget gọi useSignalR(props.signalR)
        ↓
HubConnection riêng biệt, tự reconnect
```

---

## 1. Cấu hình từ backend (JSON)

Thêm trường `signalR` vào bất kỳ component nào trong `ScreenConfig`:

```json
{
  "rows": [
    {
      "components": [
        {
          "type": "KpiCard",
          "props": {
            "title": "Doanh thu hôm nay",
            "accent": "#52c41a"
          },
          "signalR": {
            "hubUrl": "/hub/revenue",
            "methodName": "ReceiveRevenue"
          }
        },
        {
          "type": "ChartBar",
          "props": {
            "title": "Đơn hàng theo giờ",
            "data": []
          },
          "signalR": {
            "hubUrl": "/hub/orders",
            "methodName": "ReceiveOrderChart"
          }
        }
      ]
    }
  ]
}
```

- Nếu không có `signalR` → widget chỉ hiển thị dữ liệu tĩnh từ `props`.
- Mỗi component là **1 HubConnection riêng**, tự kết nối khi mount, tự đóng khi unmount.

---

## 2. Tích hợp vào widget mới

```tsx
"use client";

import { useSignalR } from "@/core/signalr/useSignalR";
import type { SignalRConfig, SignalRStatus } from "@/core/signalr/types";

interface MyWidgetProps {
  title: string;
  data?: MyData[];          // dữ liệu tĩnh từ props (fallback)
  signalR?: SignalRConfig;  // truyền xuống tự động từ ScreenRenderer
}

export function MyWidget({ title, data: staticData, signalR }: MyWidgetProps) {
  const { data: liveData, status } = useSignalR<MyData[]>(signalR);

  const data = liveData ?? staticData ?? [];

  return (
    <div>
      <StatusBadge status={status} />
      {/* render data */}
    </div>
  );
}
```

**Quy tắc ưu tiên dữ liệu:**
- Có `signalR` → dùng `liveData` (khi connected), fallback về `staticData` lúc đang kết nối
- Không có `signalR` → chỉ dùng `staticData`

---

## 3. API — `useSignalR`

```ts
function useSignalR<T>(config?: SignalRConfig): {
  data: T | null;
  status: SignalRStatus;
}
```

| Param | Mô tả |
|---|---|
| `config.hubUrl` | URL của SignalR Hub (vd: `/hub/revenue`) |
| `config.methodName` | Tên method server gọi để push data (vd: `ReceiveRevenue`) |

| Return | Mô tả |
|---|---|
| `data` | Payload mới nhất server push, `null` nếu chưa nhận được |
| `status` | `connecting` → `connected` → `reconnecting` → `disconnected` |

- **Auto reconnect**: bật mặc định (`withAutomaticReconnect`)
- **Cleanup**: connection tự `stop()` khi component unmount
- **No-op**: nếu `config` là `undefined`, hook không tạo connection, trả về `{ data: null, status: 'disconnected' }`

---

## 4. Hiển thị trạng thái kết nối

Nên thêm indicator nhỏ để user biết widget đang live hay lỗi:

```tsx
import type { SignalRStatus } from "@/core/signalr/types";

function StatusDot({ status }: { status: SignalRStatus }) {
  const color: Record<SignalRStatus, string> = {
    connected:    "bg-green-500",
    connecting:   "bg-yellow-400 animate-pulse",
    reconnecting: "bg-orange-400 animate-pulse",
    disconnected: "bg-red-500",
  };
  return <span className={`w-2 h-2 rounded-full inline-block ${color[status]}`} />;
}
```

---

## 5. Server-side (ASP.NET Core — ví dụ)

Server push data xuống client qua method name tương ứng:

```csharp
// Hub
public class RevenueHub : Hub
{
    // client đăng ký hub này tại /hub/revenue
}

// Background service push định kỳ
await hubContext.Clients.All.SendAsync("ReceiveRevenue", new {
    value = "1,234,567",
    hint = "+12% so với hôm qua",
    hintColor = "#52c41a"
});
```

Payload server push sẽ ghi đè trực tiếp vào `data` của hook — không cần merge thủ công.

---

## 6. Checklist khi thêm widget realtime mới

- [ ] Widget nhận prop `signalR?: SignalRConfig`
- [ ] Gọi `useSignalR<MyDataType>(signalR)` bên trong widget
- [ ] Merge `liveData ?? staticData` để có fallback
- [ ] Hiển thị `status` (dot, badge, hoặc skeleton khi `connecting`)
- [ ] Backend config JSON thêm `signalR: { hubUrl, methodName }`
- [ ] Server push đúng `methodName` và đúng shape của `MyDataType`
