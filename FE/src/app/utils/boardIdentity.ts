export const DEFAULT_BOARD_LOGO_ICON_KEY = "folder";
export const DEFAULT_BOARD_LOGO_COLOR_KEY = "slate";

export const BOARD_LOGO_ICON_OPTIONS = [
  { key: "folder", label: "Folder" },
  { key: "briefcase", label: "Briefcase" },
  { key: "rocket", label: "Rocket" },
  { key: "layoutGrid", label: "Grid" },
  { key: "code2", label: "Code" },
  { key: "megaphone", label: "Megaphone" },
  { key: "palette", label: "Palette" },
  { key: "chartNoAxesColumn", label: "Analytics" },
] as const;

export const BOARD_LOGO_COLOR_OPTIONS = [
  { key: "slate", label: "Slate", hex: "#64748b", bgClass: "bg-slate-500" },
  { key: "blue", label: "Blue", hex: "#3b82f6", bgClass: "bg-blue-500" },
  { key: "emerald", label: "Emerald", hex: "#10b981", bgClass: "bg-emerald-500" },
  { key: "amber", label: "Amber", hex: "#f59e0b", bgClass: "bg-amber-500" },
  { key: "rose", label: "Rose", hex: "#f43f5e", bgClass: "bg-rose-500" },
  { key: "violet", label: "Violet", hex: "#8b5cf6", bgClass: "bg-violet-500" },
  { key: "cyan", label: "Cyan", hex: "#06b6d4", bgClass: "bg-cyan-500" },
  { key: "stone", label: "Stone", hex: "#78716c", bgClass: "bg-stone-500" },
] as const;

export type BoardLogoIconKey = (typeof BOARD_LOGO_ICON_OPTIONS)[number]["key"];
export type BoardLogoColorKey = (typeof BOARD_LOGO_COLOR_OPTIONS)[number]["key"];

const VALID_ICON_KEYS = new Set<string>(BOARD_LOGO_ICON_OPTIONS.map((option) => option.key));
const VALID_COLOR_KEYS = new Set<string>(BOARD_LOGO_COLOR_OPTIONS.map((option) => option.key));

export function normalizeBoardLogoIconKey(value?: string | null): BoardLogoIconKey {
  if (value && VALID_ICON_KEYS.has(value)) {
    return value as BoardLogoIconKey;
  }

  return DEFAULT_BOARD_LOGO_ICON_KEY;
}

export function normalizeBoardLogoColorKey(value?: string | null): BoardLogoColorKey {
  if (value && VALID_COLOR_KEYS.has(value)) {
    return value as BoardLogoColorKey;
  }

  return DEFAULT_BOARD_LOGO_COLOR_KEY;
}

export function getBoardLogoColorOption(colorKey?: string | null) {
  const normalizedKey = normalizeBoardLogoColorKey(colorKey);
  return BOARD_LOGO_COLOR_OPTIONS.find((option) => option.key === normalizedKey) ?? BOARD_LOGO_COLOR_OPTIONS[0];
}

export function getBoardLogoIconOption(iconKey?: string | null) {
  const normalizedKey = normalizeBoardLogoIconKey(iconKey);
  return BOARD_LOGO_ICON_OPTIONS.find((option) => option.key === normalizedKey) ?? BOARD_LOGO_ICON_OPTIONS[0];
}
