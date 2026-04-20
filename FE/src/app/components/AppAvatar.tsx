import { Facehash, type Intensity3D, type Variant } from "facehash";
import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

const APP_AVATAR_COLORS = [
  "#ff5d8f",
  "#ff7a45",
  "#ff9f1c",
  "#c77d00",
  "#7cb518",
  "#38b000",
  "#2dd4bf",
  "#00c2ff",
  "#3b82f6",
  "#5b6cff",
  "#7c4dff",
  "#9c27b0",
  "#d946ef",
  "#ff4fa3",
  "#ff6b6b",
  "#e64980",
  "#fb7185",
  "#f97316",
  "#06b6d4",
  "#14b8a6",
];

const APP_AVATAR_FEATURE_COLOR = "#111827";

export type AppAvatarProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  username: string;
  fullName?: string;
  size: number;
  colors?: string[];
  variant?: Variant;
  intensity3d?: Intensity3D;
  interactive?: boolean;
  showInitial?: boolean;
  enableBlink?: boolean;
  showTooltip?: boolean;
  tooltip?: string;
  tooltipDelay?: number;
  square?: boolean;
};

export function AppAvatar({
  username,
  fullName,
  size,
  className,
  colors,
  variant = "solid",
  intensity3d = "subtle",
  interactive = true,
  showInitial = true,
  enableBlink = true,
  showTooltip = false,
  tooltip,
  tooltipDelay,
  square = false,
  style,
  ...props
}: AppAvatarProps) {
  const safeUsername = username.trim() || "unknown";
  const safeFullName = fullName?.trim() || "";
  const resolvedColors = colors ?? APP_AVATAR_COLORS;

  const avatarNode = (
    <Facehash
      {...props}
      name={safeUsername}
      size={size}
      colors={resolvedColors}
      variant={variant}
      intensity3d={intensity3d}
      interactive={interactive}
      showInitial={showInitial}
      enableBlink={enableBlink}
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full shadow-sm",
        square && "rounded-xl",
        className,
      )}
      style={{ color: APP_AVATAR_FEATURE_COLOR, ...style }}
      aria-label={safeFullName || safeUsername}
    />
  );

  if (!showTooltip && !tooltip) {
    return avatarNode;
  }

  return (
    <Tooltip delayDuration={tooltipDelay}>
      <TooltipTrigger asChild>{avatarNode}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tooltip ?? (safeFullName || safeUsername)}
      </TooltipContent>
    </Tooltip>
  );
}
