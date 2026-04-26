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

export const UtilityIconButton = React.forwardRef<HTMLButtonElement, UtilityIconButtonProps>(
  (
    {
      size = "sm",
      shape = "rounded",
      emphasis = "default",
      focusStyle = "default",
      className,
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) => {
    const { theme, isDarkMode } = useTheme();
    const currentTheme = getThemeColors(theme, isDarkMode);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          focusStyle === "none"
            ? "focus:outline-none"
            : "focus:outline-none",
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
  },
);

UtilityIconButton.displayName = "UtilityIconButton";
