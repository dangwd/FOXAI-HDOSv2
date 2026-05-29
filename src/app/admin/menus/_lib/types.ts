export type WidgetType = "kpi" | "line" | "bar" | "pie" | "table" | "text";
export type RefreshMode = "none" | "timer" | "sse";

export interface DesignerWidget {
  id:          string;
  type:        WidgetType;
  title:       string;
  span:        number;
  color:       string;
  ds:          string;
  xField?:     string;
  yField?:     string;
  valField?:   string;
  trendField?: string;
  catField?:   string;
  cols?:       string[];
}

export interface DesignerState {
  menuId:           string;
  screenId:         string | null;
  screenName:       string;
  screenIcon:       string;
  refreshMode:      RefreshMode;
  refreshIntervalS: number;
  widgets:          DesignerWidget[];
  selWgId:          string | null;
  palDs:            string;
}

export interface MenuUpsertForm {
  name:        string;
  slug:        string;
  icon:        string;
  description: string;
  parentId:    string | null;
  sortOrder:   number;
  isVisible:   boolean;
}

export const BLANK_MENU_FORM: MenuUpsertForm = {
  name: "", slug: "", icon: "📊", description: "",
  parentId: null, sortOrder: 0, isVisible: true,
};
