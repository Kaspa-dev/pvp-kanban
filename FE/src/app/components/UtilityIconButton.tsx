import * as React from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { cn } from "./ui/utils";
import {
  getDisabledIconActionButtonClassName,
  getIconActionButtonClassName,
} from "./iconActionButtonStyles";

type UtilityIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "pill";
  emphasis?: "default" | "elevated";
  focusStyle?: "default" | "none";
};

export function UtilityIconButton({
  size = "sm",
  shape = "rounded",
  emphasis = "default",
  focusStyle = "default",
  className,
  type = "button",
  disabled,
  ...props
}: UtilityIconButtonProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        disabled || focusStyle === "none"
          ? "focus:outline-none"
          : `focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`,
        disabled
          ? getDisabledIconActionButtonClassName(currentTheme, {
              size,
              shape,
            })
          : getIconActionButtonClassName(currentTheme, {
              size,
              shape,
              emphasis,
            }),
        className,
      )}
      {...props}
    />
  );
}
