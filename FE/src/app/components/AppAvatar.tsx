import Avatar from "boring-avatars";
import * as React from "react";
import { useTheme, type Theme } from "../contexts/ThemeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

const APP_AVATAR_PALETTES: Record<Theme, string[]> = {
  purple: ["#2f1a47", "#5b2a86", "#8b46c7", "#d946ef", "#f9a8d4"],
  ocean: ["#0f2747", "#1d4ed8", "#0ea5e9", "#22d3ee", "#a5f3fc"],
  sunset: ["#4c1d15", "#c2410c", "#f97316", "#ef4444", "#fdba74"],
  forest: ["#13261b", "#166534", "#22c55e", "#10b981", "#86efac"],
  mono: ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#e4e4e7"],
  berry: ["#3b0a45", "#a21caf", "#d946ef", "#f43f5e", "#fbcfe8"],
  lagoon: ["#112e2b", "#0f766e", "#14b8a6", "#0ea5e9", "#99f6e4"],
  citrus: ["#27330f", "#65a30d", "#a3e635", "#f59e0b", "#fef08a"],
  cobalt: ["#172554", "#1d4ed8", "#2563eb", "#38bdf8", "#bfdbfe"],
};

export type AppAvatarProps = Omit<
  React.ComponentProps<typeof Avatar>,
  "variant" | "size" | "name" | "colors" | "title"
> & {
  name: string;
  size: number;
  className?: string;
  colors?: string[];
  showTooltip?: boolean;
  tooltip?: string;
  tooltipDelay?: number;
};

export function AppAvatar({
  name,
  size,
  className,
  colors,
  square = false,
  showTooltip = false,
  tooltip,
  tooltipDelay,
  ...avatarProps
}: AppAvatarProps) {
  const { theme } = useTheme();
  const safeName = name.trim() || "Unknown User";
  const resolvedColors = colors ?? APP_AVATAR_PALETTES[theme];

  const avatarNode = (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full",
        square && "rounded-xl",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Avatar
        {...avatarProps}
        name={safeName}
        size={size}
        variant="marble"
        colors={resolvedColors}
        square={square}
        className="block h-full w-full"
      />
    </span>
  );

  if (!showTooltip && !tooltip) {
    return avatarNode;
  }

  return (
    <Tooltip delayDuration={tooltipDelay}>
      <TooltipTrigger asChild>{avatarNode}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tooltip ?? safeName}
      </TooltipContent>
    </Tooltip>
  );
}
