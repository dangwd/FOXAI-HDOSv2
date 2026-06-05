export interface DesignerWidget {
  widgetKey:   string;
  widgetType:  string;
  label:       string;
  gridX:       number;
  gridY:       number;
  gridW:       number;
  gridH:       number;
  configJson:  string;
  referenceId: string | null;
}
