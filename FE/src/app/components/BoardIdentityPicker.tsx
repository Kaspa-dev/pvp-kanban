import { Check } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import {
  BOARD_LOGO_COLOR_OPTIONS,
  BOARD_LOGO_ICON_OPTIONS,
  BoardLogoColorKey,
  BoardLogoIconKey,
} from "../utils/boardIdentity";
import { BoardLogo } from "./BoardLogo";
import { getInputLikeControlClassName } from "./inputLikeControlStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface BoardIdentityPickerProps {
  iconKey: BoardLogoIconKey;
  colorKey: BoardLogoColorKey;
  onIconChange: (iconKey: BoardLogoIconKey) => void;
  onColorChange: (colorKey: BoardLogoColorKey) => void;
}

export function BoardIdentityPicker({
  iconKey,
  colorKey,
  onIconChange,
  onColorChange,
}: BoardIdentityPickerProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const optionSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-gray-50";
  const sectionLabelClassName = `mb-2 text-sm font-semibold ${currentTheme.textSecondary}`;
  const selectedColorChipClasses = `border-transparent ring-2 ${currentTheme.ring} ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-sm scale-105`;

  return (
    <section className="space-y-5">
      <div>
        <p className={sectionLabelClassName}>
          Icon
        </p>
        <div className="grid grid-cols-4 gap-2">
          {BOARD_LOGO_ICON_OPTIONS.map((option) => {
            const isSelected = option.key === iconKey;
            const optionTextClassName = isSelected ? currentTheme.primaryText : currentTheme.textSecondary;
            const iconCardClassName = getInputLikeControlClassName(currentTheme, {
              selected: isSelected,
              surfaceClassName: optionSurfaceClassName,
            });

            return (
              <Tooltip key={option.key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onIconChange(option.key)}
                    aria-pressed={isSelected}
                    aria-label={`Choose ${option.label} icon`}
                    className={`flex flex-col items-center gap-2 px-3 py-3 ${iconCardClassName}`}
                  >
                    <BoardLogo iconKey={option.key} colorKey={colorKey} size="xs" />
                    <span className={`text-[11px] font-medium ${optionTextClassName}`}>
                      {option.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {isSelected ? `${option.label} icon selected` : `Use ${option.label} as the project icon`}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div>
        <p className={sectionLabelClassName}>
          Icon Color
        </p>
        <div className="flex flex-wrap gap-2 overflow-visible px-1 py-1">
          {BOARD_LOGO_COLOR_OPTIONS.map((option) => {
            const isSelected = option.key === colorKey;
            const colorChipClassName = getInputLikeControlClassName(currentTheme, {
              selected: isSelected,
              surfaceClassName: "",
              selectedSurfaceClassName: "",
            });

            return (
              <Tooltip key={option.key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onColorChange(option.key)}
                    aria-pressed={isSelected}
                    aria-label={`Choose ${option.label} color`}
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${colorChipClassName} ${isSelected ? selectedColorChipClasses : ""}`}
                    style={{ backgroundColor: option.hex }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {isSelected ? `${option.label} color selected` : `Use ${option.label} as the project color`}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </section>
  );
}
