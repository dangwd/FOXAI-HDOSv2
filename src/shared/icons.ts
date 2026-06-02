import type React from "react";
import {
  BarChart2, BarChart, LineChart, AreaChart, PieChart, TrendingUp, TrendingDown, Activity,
  LayoutDashboard, LayoutGrid, Layers, List, Table, Menu, Grid2X2, Columns2, Hash, Grid3X3,
  Heart, HeartPulse, Stethoscope, BedDouble, Pill, Microscope, Shield, Users, Clipboard,
  FlaskConical, Syringe, AlertTriangle,
  Building, Building2, DoorOpen, MapPin, Home, Map as MapIcon,
  FileText, Files, Calendar, Database, MessageSquare, Bell, Bookmark, Tag, Star, CheckCircle,
  Search, Filter, RefreshCw, Zap, Eye, Terminal, Clock, Settings, Info, XCircle,
  type LucideProps,
} from "lucide-react";

export type LucideComp = React.ComponentType<LucideProps>;

export const ICON_REGISTRY: Record<string, LucideComp> = {
  // Charts
  BarChart2, BarChart, LineChart, AreaChart, PieChart, TrendingUp, TrendingDown, Activity,
  // Layout
  LayoutDashboard, LayoutGrid, Layers, List, Table, Menu, Grid2X2, Columns2, Hash, Grid3X3,
  // Healthcare
  Heart, HeartPulse, Stethoscope, BedDouble, Pill, Microscope, Shield, Users, Clipboard,
  FlaskConical, Syringe, AlertTriangle,
  // Facility
  Building, Building2, DoorOpen, MapPin, Home, Map: MapIcon,
  // Documents
  FileText, Files, Calendar, Database, MessageSquare, Bell, Bookmark, Tag, Star, CheckCircle,
  // System
  Search, Filter, RefreshCw, Zap, Eye, Terminal, Clock, Settings, Info, XCircle,
};

export const ICON_CATEGORIES: { id: string; label: string; names: string[] }[] = [
  { id: "bieu-do",  label: "Biểu đồ",  names: ["BarChart2","BarChart","LineChart","AreaChart","PieChart","TrendingUp","TrendingDown","Activity"] },
  { id: "bo-cuc",   label: "Bố cục",   names: ["LayoutDashboard","LayoutGrid","Layers","List","Table","Menu","Grid2X2","Columns2","Hash","Grid3X3"] },
  { id: "y-te",     label: "Y tế",     names: ["Heart","HeartPulse","Stethoscope","BedDouble","Pill","Microscope","Shield","Users","Clipboard","FlaskConical","Syringe","AlertTriangle"] },
  { id: "co-so",    label: "Cơ sở",    names: ["Building","Building2","DoorOpen","MapPin","Home","Map"] },
  { id: "tai-lieu", label: "Tài liệu", names: ["FileText","Files","Calendar","Database","MessageSquare","Bell","Bookmark","Tag","Star","CheckCircle"] },
  { id: "he-thong", label: "Hệ thống", names: ["Search","Filter","RefreshCw","Zap","Eye","Terminal","Clock","Settings","Info","XCircle"] },
];

export function formatIconName(name: string): string {
  return name.replace(/([A-Z][a-z]+)/g, " $1").replace(/([0-9]+)/g, " $1").trim();
}
