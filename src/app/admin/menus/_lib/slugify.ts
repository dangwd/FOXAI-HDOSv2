const DIACRITICS: [RegExp, string][] = [
  [/[àáảãạăắằẳẵặâấầẩẫậ]/g, "a"],
  [/[èéẻẽẹêếềểễệ]/g,       "e"],
  [/[ìíỉĩị]/g,              "i"],
  [/[òóỏõọôốồổỗộơớờởỡợ]/g, "o"],
  [/[ùúủũụưứừửữự]/g,        "u"],
  [/[ỳýỷỹỵ]/g,              "y"],
  [/[đ]/g,                  "d"],
  [/[ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ]/g, "a"],
  [/[ÈÉẺẼẸÊẾỀỂỄỆ]/g,       "e"],
  [/[ÌÍỈĨỊ]/g,              "i"],
  [/[ÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ]/g, "o"],
  [/[ÙÚỦŨỤƯỨỪỬỮỰ]/g,        "u"],
  [/[ỲÝỶỸỴ]/g,              "y"],
  [/[Đ]/g,                  "d"],
];

export function slugify(text: string): string {
  let s = text.toLowerCase().trim();
  for (const [re, rep] of DIACRITICS) s = s.replace(re, rep);
  return s
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
