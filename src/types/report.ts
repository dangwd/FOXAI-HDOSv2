export interface MenuSummary {
  id:          string;
  name:        string;
  slug:        string;
  icon:        string | null;
  description: string | null;
  parentId:    string | null;
  sortOrder:   number;
}

export interface ScreenSummary {
  id:        string;
  name:      string;
  icon:      string | null;
  sortOrder: number;
}

export interface MenuDetail extends MenuSummary {
  screens: ScreenSummary[];
}

export interface WidgetConfig {
  operation:  string;
  params?:    Record<string, unknown>;
  xField?:    string;
  yField?:    string;
  catField?:  string;
  valField?:  string;
  [key: string]: unknown;
}

export interface WidgetDef {
  id:         string;
  widgetType: string;
  title:      string;
  colSpan:    number;
  sortOrder:  number;
  color:      string | null;
  dataSource: string;
  config:     WidgetConfig;
}

export interface ScreenDetail {
  screenId:         string;
  name:             string;
  icon:             string | null;
  menuId:           string;
  menuName:         string;
  menuSlug:         string;
  refreshMode:      "none" | "timer" | "sse";
  refreshIntervalS: number | null;
  widgets:          WidgetDef[];
}
