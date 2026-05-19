'use client';
import {
  DashboardOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  RobotOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  AlertOutlined,
  CarOutlined,
  ApartmentOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  dashboard: DashboardOutlined,
  stethoscope: MedicineBoxOutlined,
  bed: BankOutlined,
  brain: RobotOutlined,
  chart: DollarOutlined,
  package: ShoppingCartOutlined,
  alert: AlertOutlined,
  ambulance: CarOutlined,
  layers: ApartmentOutlined,
  path: DeploymentUnitOutlined,
};

export default function MenuIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? DashboardOutlined;
  return <Icon style={{ fontSize: 15 }} />;
}
