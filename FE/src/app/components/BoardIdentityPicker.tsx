import { Check } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import {
  BOARD_LOGO_COLOR_OPTIONS,
  BOARD_LOGO_ICON_OPTIONS,
  BoardLogoColorKey,
  BoardLogoIconKey,
} from "../utils/boardIdentity";
import { BoardLogo } from "./BoardLogo";

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
  const pickerSurfaceClassName = isDarkMode ? currentTheme.bgSecondary : "bg-gray-50";
  const optionSurfaceClassName = isDarkMode ? currentTheme.cardBg : "bg-gray-50";
  const selectedIconClasses = isDarkMode
    ? "border-slate-500 bg-white/5 shadow-sm"
    : "border-slate-400 bg-slate-100 shadow-sm";
  const selectedColorClasses = isDarkMode
    ? "border-slate-300/60 ring-2 ring-white/10 shadow-sm scale-105"
    : "border-white ring-2 ring-black/10 shadow-sm scale-105";

  return (
    <section className="space-y-4" aria-labelledby="board-identity-heading">
      <div className={`rounded-2xl border ${currentTheme.border} ${pickerSurfaceClassName} p-4`}>
        <div className="flex items-center gap-4">
          <BoardLogo iconKey={iconKey} colorKey={colorKey} size="md" />
          <div>
            <h3 id="board-identity-heading" className={`text-sm font-semibold ${currentTheme.text}`}>
              Board Identity
            </h3>
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
              Pick a simple icon and color that all project members will see.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${currentTheme.textMuted}`}>
          Icon
        </p>
        <div className="grid grid-cols-4 gap-2">
          {BOARD_LOGO_ICON_OPTIONS.map((option) => {
            const isSelected = option.key === iconKey;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onIconChange(option.key)}
                aria-pressed={isSelected}
                aria-label={`Choose ${option.label} icon`}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 transition-all ${
                  isSelected
                    ? selectedIconClasses
                    : `${currentTheme.border} ${optionSurfaceClassName} hover:${currentTheme.bgTertiary}`
                }`}
              >
                <BoardLogo iconKey={option.key} colorKey={colorKey} size="xs" />
                <span className={`text-[11px] font-medium ${currentTheme.textSecondary}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${currentTheme.textMuted}`}>
          Color
        </p>
        <div className="flex flex-wrap gap-2">
          {BOARD_LOGO_COLOR_OPTIONS.map((option) => {
            const isSelected = option.key === colorKey;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onColorChange(option.key)}
                aria-pressed={isSelected}
                aria-label={`Choose ${option.label} color`}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                  isSelected
                    ? selectedColorClasses
                    : `${currentTheme.border} hover:scale-105`
                }`}
                style={{ backgroundColor: option.hex }}
              >
                {isSelected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
