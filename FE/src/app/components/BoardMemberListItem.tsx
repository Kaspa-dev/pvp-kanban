import type { ReactNode } from "react";
import { Crown } from "lucide-react";
import { getThemeColors } from "../contexts/ThemeContext";
import { BoardRole } from "../utils/boards";
import { AppAvatar } from "./AppAvatar";

type ThemeColors = ReturnType<typeof getThemeColors>;

interface BoardMemberListItemProps {
  currentTheme: ThemeColors;
  displayName: string;
  username: string;
  email?: string;
  role?: BoardRole;
  surfaceClassName: string;
  action?: ReactNode;
  hoverBorderClassName?: string;
  showRoleIcon?: boolean;
  variant?: "card" | "flat";
}

export function BoardMemberListItem({
  currentTheme,
  displayName,
  username,
  email,
  role,
  surfaceClassName,
  action,
  hoverBorderClassName,
  showRoleIcon = true,
  variant = "card",
}: BoardMemberListItemProps) {
  const isOwner = role === "owner";
  const containerClassName =
    variant === "flat"
      ? `flex items-center justify-between gap-3 py-3 ${surfaceClassName}`
      : `flex items-center justify-between gap-3 rounded-xl border p-3 ${surfaceClassName} ${currentTheme.border} ${hoverBorderClassName ?? ""}`;

  return (
    <div className={containerClassName}>
      <div className="flex min-w-0 items-center gap-3">
        <AppAvatar
          username={username}
          fullName={displayName}
          size={40}
          className="shrink-0"
        />
        <div className="min-w-0">
          <p className={`truncate font-semibold ${currentTheme.text}`}>{displayName}</p>
          <p className={`truncate text-xs ${currentTheme.textMuted}`}>@{username}</p>
          {email ? (
            <p className={`truncate text-xs ${currentTheme.textMuted}`}>{email}</p>
          ) : null}
          {role ? (
            <div className="flex items-center gap-1.5">
              {isOwner && showRoleIcon ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : null}
              <p className={`text-xs ${currentTheme.textMuted}`}>
                {isOwner ? "Owner" : "Team Member"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
