export interface ModuleForm {
  groupId:                string;   // UUID from module_groups
  slug:                   string;
  label:                  string;
  icon:                   string;
  description:            string;
  sortOrder:              number;
  refreshIntervalSeconds: string;   // stored as string for <input>
  isActive:               boolean;
  isVisible:              boolean;
  requiredRoles:          string[];
}

export const BLANK_FORM: ModuleForm = {
  groupId: "", slug: "", label: "", icon: "", description: "",
  sortOrder: 0, refreshIntervalSeconds: "", isActive: true, isVisible: true, requiredRoles: [],
};
