import { NextResponse } from 'next/server';
import type { ScreenConfig } from '@/types/screen';

/**
 * GET /api/screen/:id
 * Backend định nghĩa màn hình: phần nào hiển thị, dữ liệu gì.
 * FE chỉ render theo — không biết gì về nội dung.
 */
const SCREENS: Record<string, ScreenConfig> = {
  dashboard: {
    title: 'Executive Dashboard',
    badge: 'BETA',
    subtitle: 'Cập nhật lần cuối: 19/05/2026 08:30 — Dữ liệu thời gian thực',
    rows: [
      // Hàng 1: 6 KPI cards
      {
        components: [
          { type: 'KpiCard', props: { title: 'Tổng BN hôm nay', value: 43, accent: '#1677ff', hint: '+5 so với hôm qua', hintColor: '#52c41a' } },
          { type: 'KpiCard', props: { title: 'Tổng giờ điều trị', value: '230.3 hr', accent: '#52c41a', hint: 'Trung bình 5.4 hr/BN', hintColor: '#8b949e' } },
          { type: 'KpiCard', props: { title: 'BN xuất viện', value: 79, accent: '#722ed1', hint: '↑ 12%', hintColor: '#52c41a' } },
          { type: 'KpiCard', props: { title: 'Công suất giường', value: '31.8%', accent: '#faad14', hint: '38/120 giường', hintColor: '#8b949e' } },
          { type: 'KpiCard', props: { title: 'Doanh thu (nghìn đ)', value: '60,075', accent: '#13c2c2', hint: '↑ 8.2% vs tháng trước', hintColor: '#52c41a' } },
          { type: 'KpiCard', props: { title: 'Sự cố chưa xử lý', value: 0, accent: '#ff4d4f', hint: 'Không có cảnh báo', hintColor: '#52c41a' } },
        ],
      },
      // Hàng 2: Theo dõi từng khoa (left 16) + Chiến lược (right 8)
      {
        components: [
          {
            type: 'ProgressList',
            span: 16,
            props: {
              title: 'Công việc đang theo dõi từng khoa',
              headerAction: 'Xem tất cả',
              maxValue: 100,
              items: [
                { label: 'Khoa Nội tim mạch', value: 30, secondaryValue: 45, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Ngoại tiêu hóa', value: 21, secondaryValue: 50, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Sản', value: 38, secondaryValue: 60, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Nhi', value: 44, secondaryValue: 55, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Chấn thương chỉnh hình', value: 62, secondaryValue: 70, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Ung bướu', value: 28, secondaryValue: 40, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Thần kinh', value: 35, secondaryValue: 48, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa ICU', value: 72, secondaryValue: 80, color: '#ff4d4f', secondaryColor: '#faad14' },
                { label: 'Khoa Cấp cứu', value: 55, secondaryValue: 65, color: '#faad14', secondaryColor: '#faad14' },
                { label: 'Khoa Da liễu', value: 18, secondaryValue: 30, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Tai mũi họng', value: 24, secondaryValue: 35, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Mắt', value: 19, secondaryValue: 28, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Phục hồi chức năng', value: 41, secondaryValue: 52, color: '#52c41a', secondaryColor: '#faad14' },
                { label: 'Khoa Hô hấp', value: 57, secondaryValue: 68, color: '#faad14', secondaryColor: '#faad14' },
                { label: 'Khoa Nội tổng hợp', value: 33, secondaryValue: 45, color: '#52c41a', secondaryColor: '#faad14' },
              ],
            },
          },
          {
            type: 'BulletList',
            span: 8,
            props: {
              title: 'Chiến lược dòng tiền hay',
              items: [
                { text: 'Critical thay van tim đơn thuần - Thực tế 1', status: 'active' },
                { text: 'Critical thay van tim đơn thuần - Thực tế 2', status: 'active' },
                { text: 'Critical thay van tim đơn thuần - Thực tế 3', status: 'active' },
                { text: 'Critical thay van tim đơn thuần - Thực tế 4', status: 'pending' },
                { text: 'Critical thay van tim đơn thuần - Thực tế 5', status: 'pending' },
                { text: 'Critical thay van tim đơn thuần - Thực tế 6', status: 'critical' },
              ],
            },
          },
        ],
      },
      // Hàng 3: Stats summary
      {
        components: [
          {
            type: 'StatsSummary',
            span: 24,
            props: {
              items: [
                { label: 'Tổng BN đang theo dõi', value: 43, color: '#1677ff' },
                { label: 'Tổng BN đã xuất', value: 42, color: '#52c41a' },
                { label: 'BN chưa có CP', value: 0, color: '#8b949e' },
                { label: 'Tổng ngày điều trị', value: 70, color: '#722ed1' },
                { label: 'Sự cố hôm nay', value: 0, color: '#8b949e' },
              ],
            },
          },
        ],
      },
      // Hàng 4: 3 panel dưới
      {
        components: [
          {
            type: 'BulletList',
            span: 8,
            props: {
              title: 'Ân hạn sắp — 175',
              items: [
                { text: 'Đỗ Thị Bích Hương — 14', status: 'critical', badge: 'Critical' },
                { text: 'Nguyễn Văn Minh — Ổn định BH', status: 'pending', badge: 'Warning' },
                { text: 'Trần Quốc Toản — BH', status: 'pending', badge: 'Warning' },
                { text: 'Bùi Thị Thu Hà', status: 'active', badge: 'OK' },
                { text: 'Phạm Minh Khoa', status: 'active', badge: 'OK' },
              ],
              footerActions: [
                { label: 'Xem tất cả bệnh nhân', variant: 'link' },
                { label: 'Đưa ra đề xuất', color: '#1677ff' },
              ],
            },
          },
          {
            type: 'BulletList',
            span: 8,
            props: {
              title: 'Clinical Pathway',
              items: [
                { text: 'Acute Ischemic Stroke', status: 'active', badge: 'Đang chạy' },
                { text: 'Route to Revascularization', status: 'active', badge: 'Đang chạy' },
                { text: 'Hip Fracture', status: 'pending', badge: 'Chờ xử lý' },
                { text: 'Community Acquired Pneumonia', status: 'done', badge: 'Hoàn thành' },
                { text: 'Heart Failure Management', status: 'active', badge: 'Đang chạy' },
              ],
              footerActions: [
                { label: 'Xem tất cả pathway', variant: 'link' },
                { label: 'Thêm pathway', color: '#722ed1' },
              ],
            },
          },
          {
            type: 'ProgressList',
            span: 8,
            props: {
              title: 'Population Health',
              maxValue: 100,
              items: [
                { label: 'Anh ơi sắp tiểu đường', value: 82, color: '#ff4d4f' },
                { label: 'Anh ơi sắp tăng huyết áp', value: 67, color: '#faad14' },
                { label: 'Anh ơi sắp thừa cân', value: 45, color: '#52c41a' },
                { label: 'Quản lý bệnh mãn tính', value: 78, color: '#1677ff' },
                { label: 'Theo dõi sau xuất viện', value: 55, color: '#722ed1' },
              ],
              footerActions: [
                { label: 'Xem tất cả bệnh nhân', variant: 'link' },
                { label: 'Đưa ra đề xuất', color: '#52c41a' },
              ],
            },
          },
        ],
      },
    ],
  },

  'patient-exam': {
    title: 'Khám bệnh nhân',
    rows: [
      {
        components: [
          { type: 'KpiCard', props: { title: 'Chờ khám', value: 14, accent: '#faad14' }, span: 6 },
          { type: 'KpiCard', props: { title: 'Đang khám', value: 3, accent: '#1677ff' }, span: 6 },
          { type: 'KpiCard', props: { title: 'Hoàn thành hôm nay', value: 52, accent: '#52c41a' }, span: 6 },
          { type: 'KpiCard', props: { title: 'Tổng ca tháng', value: 1240, accent: '#722ed1' }, span: 6 },
        ],
      },
      {
        components: [
          {
            type: 'DataTable', span: 24,
            props: {
              columns: [
                { key: 'id', title: 'Mã BN' },
                { key: 'name', title: 'Họ tên' },
                { key: 'reason', title: 'Lý do khám' },
                { key: 'status', title: 'Trạng thái', render: 'tag', tagColors: { 'Chờ khám': 'orange', 'Đang khám': 'blue', 'Hoàn thành': 'green' } },
              ],
              data: [
                { id: 'BN-001', name: 'Nguyễn Văn A', reason: 'Sốt cao', status: 'Chờ khám' },
                { id: 'BN-002', name: 'Trần Thị B', reason: 'Đau ngực', status: 'Đang khám' },
                { id: 'BN-003', name: 'Lê Minh C', reason: 'Kiểm tra định kỳ', status: 'Hoàn thành' },
              ],
            },
          },
        ],
      },
    ],
  },

  finance: {
    title: 'Tài chính RCM+DRG',
    rows: [
      {
        components: [
          { type: 'KpiCard', props: { title: 'Doanh thu tháng (tr.)', value: 1240, accent: '#52c41a', hint: '↑ 8%', hintColor: '#52c41a' } },
          { type: 'KpiCard', props: { title: 'Chi phí (tr.)', value: 876, accent: '#ff4d4f' } },
          { type: 'KpiCard', props: { title: 'Lợi nhuận (tr.)', value: 364, accent: '#1677ff' } },
        ],
      },
      {
        components: [
          {
            type: 'DataTable', span: 24,
            props: {
              columns: [
                { key: 'drg', title: 'Mã DRG' },
                { key: 'desc', title: 'Mô tả' },
                { key: 'cases', title: 'Số ca' },
                { key: 'revenue', title: 'Doanh thu (tr.)' },
                { key: 'status', title: 'Trạng thái', render: 'tag', tagColors: { 'Đạt': 'green', 'Không đạt': 'red' } },
              ],
              data: [
                { drg: 'DRG-470', desc: 'Thay khớp háng', cases: 12, revenue: 480, status: 'Đạt' },
                { drg: 'DRG-291', desc: 'Suy tim nặng', cases: 8, revenue: 192, status: 'Đạt' },
                { drg: 'DRG-193', desc: 'Bệnh phổi nặng', cases: 15, revenue: 210, status: 'Không đạt' },
              ],
            },
          },
        ],
      },
    ],
  },

  supply: {
    title: 'Chuỗi cung ứng',
    rows: [
      { components: [{ type: 'AlertBanner', span: 24, props: { message: '3 vật tư cần đặt hàng ngay', type: 'warning' } }] },
      {
        components: [
          {
            type: 'DataTable', span: 24,
            props: {
              columns: [
                { key: 'id', title: 'Mã vật tư' },
                { key: 'name', title: 'Tên' },
                { key: 'stock', title: 'Tồn kho' },
                { key: 'unit', title: 'Đơn vị' },
                { key: 'status', title: 'Trạng thái', render: 'tag', tagColors: { 'Đủ': 'green', 'Thấp': 'orange', 'Hết': 'red' } },
              ],
              data: [
                { id: 'VT-001', name: 'Kim tiêm 23G', stock: 2400, unit: 'Cái', status: 'Đủ' },
                { id: 'VT-002', name: 'Găng tay vô khuẩn', stock: 150, unit: 'Đôi', status: 'Thấp' },
                { id: 'VT-003', name: 'Oxy y tế (bình)', stock: 8, unit: 'Bình', status: 'Hết' },
              ],
            },
          },
        ],
      },
    ],
  },

  cdss: {
    title: 'AI Lâm sàng CDSS',
    rows: [
      { components: [{ type: 'AlertBanner', span: 24, props: { message: 'Hệ thống hỗ trợ quyết định lâm sàng đang hoạt động', type: 'info' } }] },
      {
        components: [
          { type: 'KpiCard', props: { title: 'Cảnh báo hôm nay', value: 3, accent: '#ff4d4f' } },
          { type: 'KpiCard', props: { title: 'Tương tác thuốc', value: 7, accent: '#faad14' } },
          { type: 'KpiCard', props: { title: 'Gợi ý chấp nhận', value: 21, accent: '#52c41a', hint: '87% acceptance rate', hintColor: '#52c41a' } },
        ],
      },
    ],
  },

  inpatient: {
    title: 'Giường & Nội trú',
    rows: [
      {
        components: [
          { type: 'KpiCard', props: { title: 'Tổng giường', value: 120, accent: '#1677ff' } },
          { type: 'KpiCard', props: { title: 'Đang sử dụng', value: 87, accent: '#ff4d4f' } },
          { type: 'KpiCard', props: { title: 'Còn trống', value: 33, accent: '#52c41a' } },
          { type: 'KpiCard', props: { title: 'Công suất ICU (%)', value: 67, accent: '#faad14', hint: '8/12 giường', hintColor: '#faad14' } },
        ],
      },
    ],
  },

  incident: {
    title: 'Runbook & Incident',
    rows: [
      {
        components: [
          { type: 'KpiCard', props: { title: 'Đang mở', value: 7, accent: '#ff4d4f' } },
          { type: 'KpiCard', props: { title: 'Critical', value: 2, accent: '#cf1322' } },
          { type: 'KpiCard', props: { title: 'Đã xử lý hôm nay', value: 4, accent: '#52c41a' } },
        ],
      },
    ],
  },

  ambulance: {
    title: 'Xe cấp cứu 115',
    rows: [
      {
        components: [
          { type: 'KpiCard', props: { title: 'Đang chạy', value: 2, accent: '#ff4d4f' } },
          { type: 'KpiCard', props: { title: 'Sẵn sàng', value: 1, accent: '#52c41a' } },
          { type: 'KpiCard', props: { title: 'Bảo trì', value: 1, accent: '#faad14' } },
        ],
      },
    ],
  },

  'digital-twin': {
    title: 'Digital Twin',
    rows: [
      { components: [{ type: 'AlertBanner', span: 24, props: { message: 'Tính năng đang phát triển', description: 'Dữ liệu hiển thị là mô phỏng.', type: 'info' } }] },
      {
        components: [
          { type: 'KpiCard', props: { title: 'Công suất giường (%)', value: 72 } },
          { type: 'KpiCard', props: { title: 'Lưu lượng / giờ', value: 18 } },
          { type: 'KpiCard', props: { title: 'Thời gian chờ TB (phút)', value: 23 } },
        ],
      },
    ],
  },

  'clinical-path': {
    title: 'Clinical Pathway',
    rows: [
      { components: [{ type: 'AlertBanner', span: 24, props: { message: 'Clinical Pathway chuẩn quốc tế — đang phát triển', type: 'info' } }] },
    ],
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = SCREENS[id];
  if (!config) {
    return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
  }
  return NextResponse.json(config);
}
