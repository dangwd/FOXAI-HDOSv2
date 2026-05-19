# UI Libraries

## Core UI Framework

| Thư viện | Version | Vai trò |
|---|---|---|
| **Ant Design** | `5.21.6` | Component library chính — table, modal, drawer, form, button, tag, badge, v.v. |
| **@ant-design/icons** | `5.5.1` | Icon set đi kèm Ant Design |
| **Tailwind CSS** | `4.1.4` | Layout, spacing, utility classes |

Ant Design dùng **dark theme**. Tailwind và Ant Design không xung đột — Ant Design lo component tokens, Tailwind lo layout.

---

## Chart / Data Visualization

| Thư viện | Version | Vai trò |
|---|---|---|
| **recharts** | `^3.8.1` | Chart library chính |

### Các component hay dùng

| Component | Loại |
|---|---|
| `LineChart`, `Line` | Line chart |
| `AreaChart`, `Area` | Area chart |
| `BarChart`, `Bar`, `Cell` | Bar chart |
| `ResponsiveContainer` | Responsive wrapper |
| `XAxis`, `YAxis` | Trục biểu đồ |
| `Tooltip`, `Legend` | Interaction |

---

## State & Data Fetching

| Thư viện | Version | Vai trò |
|---|---|---|
| **TanStack Query** | `5.62.16` | Server state, cache, refetch |
| **Zustand** | `5.0.2` | Client UI state |
| **axios** | `1.7.9` | HTTP client |

---

## Forms & Validation

| Thư viện | Version | Vai trò |
|---|---|---|
| **react-hook-form** | `7.54.2` | Form state management |
| **@hookform/resolvers** | `3.9.1` | Bridge react-hook-form ↔ Zod |
| **zod** | `3.23.8` | Schema validation, type inference |

---

## Utilities

| Thư viện | Version | Vai trò |
|---|---|---|
| **dayjs** | `1.11.13` | Date formatting, manipulation |
| **clsx** | `2.1.1` | Conditional class merging |
| **tailwind-merge** | `2.6.0` | Merge Tailwind classes không conflict |
| **@microsoft/signalr** | `^10.0.0` | WebSocket / realtime |
| **keycloak-js** | `^26.2.4` | Authentication (Keycloak SSO) |

---

## Dev Dependencies

| Thư viện | Version | Vai trò |
|---|---|---|
| **TypeScript** | `5.7.3` | Type checking |
| **ESLint** | `8.57.1` | Linting |
| **patch-package** | `^8.0.1` | Patch node_modules |
| **@tailwindcss/postcss** | `4.1.4` | PostCSS integration cho Tailwind v4 |
