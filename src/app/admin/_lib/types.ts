export interface DesignerWidget {
  widgetKey:        string;
  title:            string;
  subtitle:         string;
  chartType:        string;
  gridX:            number;
  gridY:            number;
  gridW:            number;
  gridH:            number;
  operationPattern: string;
  providerId:       string;
  paramsTemplate:   string;
  visualConfig:     string;
  filterBindings:   string[];
  interactions:     string;
  filterKey:        string;
}
