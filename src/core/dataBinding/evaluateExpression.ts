// Traverse a dot-notation path (supports array index: items[0], kebab-nams[0])
function resolvePath(root: unknown, path: string): unknown {
  return path.split(".").reduce((cur: unknown, segment: string) => {
    if (cur == null) return undefined;
    // Support hyphenated keys: benh-nhan[0]
    const arrMatch = segment.match(/^([\w-]+)\[(\d+)\]$/);
    if (arrMatch) {
      const arr = (cur as Record<string, unknown>)[arrMatch[1]];
      return Array.isArray(arr) ? arr[parseInt(arrMatch[2])] : undefined;
    }
    return (cur as Record<string, unknown>)[segment];
  }, root);
}

/**
 * Evaluate one or more `{{sources.<path>}}` tokens in an expression string.
 * - Pure expression:   `"{{sources.record.HoTen}}"` → `"Phạm Quỳnh Như"`
 * - No sub-path:       `"{{sources.ward}}"` → stringified whole object
 * - Inline in text:    `"Patient: {{sources.record.HoTen}}"` → `"Patient: Phạm Quỳnh Như"`
 * Returns `null` if no token matched.
 */
export function evaluateExpression(
  expression: string,
  sources: Record<string, unknown>,
): string | null {
  // [\w.\[\]-]+ — supports dots, brackets, and hyphens in namespace/field names
  const re = /\{\{\s*sources\.([\w.\[\]-]+)\s*\}\}/g;
  let matched = false;

  const result = expression.replace(re, (_, path: string) => {
    matched = true;
    const val = resolvePath(sources, path);
    if (val == null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  });

  return matched ? result : null;
}

/**
 * Like evaluateExpression but returns the raw (un-stringified) value.
 * Useful when the expression resolves to an array or object (Table/Chart data).
 * Only handles a pure `{{sources.<path>}}` expression — no inline text.
 */
export function evaluateRaw(
  expression: string,
  sources: Record<string, unknown>,
): unknown {
  const match = expression.match(/^\{\{\s*sources\.([\w.\[\]-]+)\s*\}\}$/);
  if (!match) return null;
  return resolvePath(sources, match[1]);
}

/** Apply a displayFormat hint to an already-resolved string value. */
export function applyDisplayFormat(value: string, format: string | null): string {
  if (!format || !value) return value;

  if (format.startsWith("date:")) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const pattern = format.slice(5);
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = String(date.getFullYear());
        return pattern.replace("DD", d).replace("MM", m).replace("YYYY", y);
      }
    } catch { /* ignore */ }
  }

  if (format.startsWith("currency:")) {
    try {
      const currency = format.slice(9);
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
      }).format(Number(value));
    } catch { /* ignore */ }
  }

  return value;
}
