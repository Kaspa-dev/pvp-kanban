export type LevelTier = {
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  colorStrong: string;
  glow: string;
};

export const LEVEL_TIERS: LevelTier[] = [
  { name: "Slate", minLevel: 1, maxLevel: 10, color: "#94a3b8", colorStrong: "#64748b", glow: "rgba(148, 163, 184, 0.34)" },
  { name: "Ember", minLevel: 11, maxLevel: 20, color: "#fb7185", colorStrong: "#e11d48", glow: "rgba(251, 113, 133, 0.34)" },
  { name: "Cinder", minLevel: 21, maxLevel: 30, color: "#fb923c", colorStrong: "#ea580c", glow: "rgba(251, 146, 60, 0.34)" },
  { name: "Amber", minLevel: 31, maxLevel: 40, color: "#facc15", colorStrong: "#ca8a04", glow: "rgba(250, 204, 21, 0.34)" },
  { name: "Lime", minLevel: 41, maxLevel: 50, color: "#a3e635", colorStrong: "#65a30d", glow: "rgba(163, 230, 53, 0.34)" },
  { name: "Jade", minLevel: 51, maxLevel: 60, color: "#34d399", colorStrong: "#059669", glow: "rgba(52, 211, 153, 0.34)" },
  { name: "Tide", minLevel: 61, maxLevel: 70, color: "#2dd4bf", colorStrong: "#0f766e", glow: "rgba(45, 212, 191, 0.34)" },
  { name: "Sky", minLevel: 71, maxLevel: 80, color: "#38bdf8", colorStrong: "#0284c7", glow: "rgba(56, 189, 248, 0.34)" },
  { name: "Azure", minLevel: 81, maxLevel: 90, color: "#60a5fa", colorStrong: "#2563eb", glow: "rgba(96, 165, 250, 0.34)" },
  { name: "Indigo", minLevel: 91, maxLevel: 100, color: "#818cf8", colorStrong: "#4f46e5", glow: "rgba(129, 140, 248, 0.34)" },
  { name: "Violet", minLevel: 101, maxLevel: 110, color: "#a78bfa", colorStrong: "#7c3aed", glow: "rgba(167, 139, 250, 0.36)" },
  { name: "Orchid", minLevel: 111, maxLevel: 120, color: "#e879f9", colorStrong: "#c026d3", glow: "rgba(232, 121, 249, 0.36)" },
  { name: "Fuchsia", minLevel: 121, maxLevel: 130, color: "#f472b6", colorStrong: "#db2777", glow: "rgba(244, 114, 182, 0.36)" },
  { name: "Rose", minLevel: 131, maxLevel: 140, color: "#fb7185", colorStrong: "#be123c", glow: "rgba(251, 113, 133, 0.36)" },
  { name: "Solar", minLevel: 141, maxLevel: 150, color: "#f59e0b", colorStrong: "#d97706", glow: "rgba(245, 158, 11, 0.36)" },
];

export const LEVEL_BADGE_VARIANTS = [
  {
    key: "split-arc",
    label: "Split Arc",
    description: "Two bold opposing arcs with a quieter inner rail.",
  },
  {
    key: "wide-break",
    label: "Wide Break",
    description: "A heavier ring with larger negative-space cuts.",
  },
  {
    key: "open-gates",
    label: "Open Gates",
    description: "Four short gate marks that avoid a full circular outline.",
  },
  {
    key: "orbit-nodes",
    label: "Orbit Nodes",
    description: "A thin orbit track anchored by four strong nodes.",
  },
  {
    key: "corner-clamps",
    label: "Corner Clamps",
    description: "Bracket-like clamps around the avatar instead of a circle.",
  },
  {
    key: "bracket-tabs",
    label: "Bracket Tabs",
    description: "Cardinal tabs that feel more mechanical and compact.",
  },
  {
    key: "dash-track",
    label: "Dash Track",
    description: "Segmented technical rail with one heavier progress sweep.",
  },
  {
    key: "echelon",
    label: "Echelon",
    description: "Stacked arc tiers with stepped spacing and asymmetry.",
  },
  {
    key: "compass-cut",
    label: "Compass Cut",
    description: "A compass-like ring with four directional cuts.",
  },
  {
    key: "offset-rails",
    label: "Offset Rails",
    description: "Two rotated rails that create a dynamic split-ring silhouette.",
  },
  {
    key: "crown-gaps",
    label: "Crown Gaps",
    description: "A broken halo with small crown-like tabs at the top.",
  },
  {
    key: "lunar-bars",
    label: "Lunar Bars",
    description: "Two thick side crescents with a quiet internal orbit.",
  },
  {
    key: "pinwheel",
    label: "Pinwheel",
    description: "Four rotating arc blades that feel active but compact.",
  },
  {
    key: "rail-corners",
    label: "Rail Corners",
    description: "Rounded corner rails instead of a continuous circular badge.",
  },
  {
    key: "signal-pips",
    label: "Signal Pips",
    description: "A minimal ring with small status pips on one side.",
  },
  {
    key: "visor",
    label: "Visor",
    description: "Top and bottom visor arcs with a strong horizontal attitude.",
  },
  {
    key: "halo-slices",
    label: "Halo Slices",
    description: "Evenly sliced halo segments with one heavier accent arc.",
  },
  {
    key: "offset-square",
    label: "Offset Square",
    description: "A rounded-square frame offset from the circular identicon.",
  },
  {
    key: "double-bite",
    label: "Double Bite",
    description: "A full ring with two intentional cut bites removed.",
  },
  {
    key: "north-star",
    label: "North Star",
    description: "A thin compass ring with four small diamond anchors.",
  },
  {
    key: "rivet-ring",
    label: "Rivet Ring",
    description: "Tiny rivets around the orbit with two stronger level arcs.",
  },
  {
    key: "wave-arc",
    label: "Wave Arc",
    description: "Soft wave rails for a less mechanical ring silhouette.",
  },
  {
    key: "split-bands",
    label: "Split Bands",
    description: "Two short band stacks that avoid enclosing the avatar.",
  },
  {
    key: "thin-keel",
    label: "Thin Keel",
    description: "A slim upper arc paired with a pointed keel underneath.",
  },
  {
    key: "orbital-brackets",
    label: "Orbital Brackets",
    description: "Four detached orbit brackets with strong negative space.",
  },
] as const;

export type LevelBadgeVariant = (typeof LEVEL_BADGE_VARIANTS)[number]["key"];

export const LEVEL_MARKER_VARIANTS = [
  {
    key: "gradient-pill",
    label: "Gradient Pill",
    description: "Current rounded numeric capsule with a soft glass rim.",
  },
  {
    key: "data-plate",
    label: "Data Plate",
    description: "Small rectangular instrument label with tighter spacing.",
  },
  {
    key: "notched-ticket",
    label: "Notched Ticket",
    description: "Clipped-corner ticket that feels custom but compact.",
  },
  {
    key: "glass-lozenge",
    label: "Glass Lozenge",
    description: "Lighter translucent badge with a stronger inner highlight.",
  },
  {
    key: "diamond-pin",
    label: "Diamond Pin",
    description: "Rotated marker pinned to the corner of the rails.",
  },
  {
    key: "corner-flag",
    label: "Corner Flag",
    description: "A small flag tab folded over the upper-right corner.",
  },
  {
    key: "orbit-dot",
    label: "Orbit Dot",
    description: "Compact circular marker that reads like an orbit node.",
  },
  {
    key: "bracket-tag",
    label: "Bracket Tag",
    description: "Numeric tag with tiny bracket rails on both sides.",
  },
  {
    key: "bottom-dock",
    label: "Bottom Dock",
    description: "Level panel docked under the avatar instead of top-right.",
  },
  {
    key: "vertical-tab",
    label: "Vertical Tab",
    description: "Slim side tab attached to the right rail.",
  },
] as const;

export type LevelMarkerVariant = (typeof LEVEL_MARKER_VARIANTS)[number]["key"];

export function normalizeAvatarLevel(level: number | null | undefined): number | null {
  if (typeof level !== "number" || !Number.isFinite(level) || level <= 0) {
    return null;
  }

  return Math.min(150, Math.floor(level));
}

export function getLevelTier(level: number): LevelTier {
  return LEVEL_TIERS.reduce((current, tier) => (level >= tier.minLevel ? tier : current), LEVEL_TIERS[0]);
}
