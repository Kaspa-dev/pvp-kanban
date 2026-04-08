import {
  Briefcase,
  ChartNoAxesColumn,
  Code2,
  Folder,
  LayoutGrid,
  LucideIcon,
  Megaphone,
  Palette,
  Rocket,
} from "lucide-react";
import {
  BoardLogoColorKey,
  BoardLogoIconKey,
  getBoardLogoColorOption,
  normalizeBoardLogoColorKey,
  normalizeBoardLogoIconKey,
} from "../utils/boardIdentity";

const ICON_MAP: Record<BoardLogoIconKey, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  rocket: Rocket,
  layoutGrid: LayoutGrid,
  code2: Code2,
  megaphone: Megaphone,
  palette: Palette,
  chartNoAxesColumn: ChartNoAxesColumn,
};

type BoardLogoSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BoardLogoSize, { container: string; icon: string }> = {
  xs: {
    container: "h-9 w-9 rounded-lg",
    icon: "h-4 w-4",
  },
  sm: {
    container: "h-10 w-10 rounded-xl",
    icon: "h-5 w-5",
  },
  md: {
    container: "h-12 w-12 rounded-xl",
    icon: "h-6 w-6",
  },
  lg: {
    container: "h-14 w-14 rounded-2xl",
    icon: "h-7 w-7",
  },
};

interface BoardLogoProps {
  iconKey?: string | BoardLogoIconKey | null;
  colorKey?: string | BoardLogoColorKey | null;
  size?: BoardLogoSize;
  className?: string;
}

export function BoardLogo({
  iconKey,
  colorKey,
  size = "md",
  className = "",
}: BoardLogoProps) {
  const normalizedIconKey = normalizeBoardLogoIconKey(iconKey);
  const normalizedColorKey = normalizeBoardLogoColorKey(colorKey);
  const Icon = ICON_MAP[normalizedIconKey];
  const colorOption = getBoardLogoColorOption(normalizedColorKey);
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${sizeClasses.container} ${colorOption.bgClass} text-white shadow-sm ${className}`.trim()}
    >
      <Icon className={sizeClasses.icon} aria-hidden="true" />
    </div>
  );
}
