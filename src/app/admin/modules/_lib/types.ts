import type { ModuleGroup } from "@/infrastructure/http/adminApi";

export interface ModuleForm {
  group:           ModuleGroup | "";
  slug:            string;
  label:           string;
  icon:            string;
  description:     string;
  sortOrder:       number;
  refreshInterval: string;
  isActive:        boolean;
  isVisible:       boolean;
  roles:           string[];
}

export const BLANK_FORM: ModuleForm = {
  group: "", slug: "", label: "", icon: "", description: "",
  sortOrder: 0, refreshInterval: "", isActive: true, isVisible: true, roles: [],
};
