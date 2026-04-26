import { CalendarDays, ChevronDown } from "lucide-react";
import { addDays, addMonths, format, isValid, parseISO, startOfToday } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import { UtilityIconButton } from "./UtilityIconButton";
import { MAX_TASK_DUE_DATE_MONTHS } from "../utils/cards";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface TaskDueDatePickerProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  hasError?: boolean;
  onBlur?: () => void;
}

const QUICK_DATE_PRESETS = [
  {
    label: "Today",
    getValue: () => startOfToday(),
  },
  {
    label: "Tomorrow",
    getValue: () => addDays(startOfToday(), 1),
  },
  {
    label: "In 3 days",
    getValue: () => addDays(startOfToday(), 3),
  },
  {
    label: "Next week",
    getValue: () => addDays(startOfToday(), 7),
  },
];

function parseDateValue(value: string) {
  if (!value) {
    return undefined;
  }

  const parsedDate = parseISO(value);
  return isValid(parsedDate) ? parsedDate : undefined;
}

export function TaskDueDatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a due date",
  hasError = false,
  onBlur,
}: TaskDueDatePickerProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const selectedDate = parseDateValue(value);
  const minimumSelectableDate = startOfToday();
  const maximumSelectableDate = addMonths(minimumSelectableDate, MAX_TASK_DUE_DATE_MONTHS);
  const pickerSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const pickerPopoverSurfaceClassName = isDarkMode ? "!bg-zinc-950" : "!bg-input-background";
  const pickerShadowClassName = isDarkMode
    ? "shadow-[0_20px_48px_rgba(0,0,0,0.58)]"
    : "shadow-[0_20px_44px_rgba(15,23,42,0.22)]";
  const subtleActionButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none ${currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.textSecondary}`;
  const selectedActionButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none ${currentTheme.primaryBg} ${currentTheme.primaryText} hover:brightness-[0.98] dark:hover:brightness-110`;
  const triggerIconClassName = selectedDate ? currentTheme.primaryText : currentTheme.textMuted;
  const triggerTextClassName = selectedDate ? currentTheme.text : currentTheme.textMuted;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              id={id}
              type="button"
              onBlur={onBlur}
              aria-label={selectedDate ? `Due date ${format(selectedDate, "MMMM d, yyyy")}` : "Choose due date"}
              aria-invalid={hasError}
              className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left outline-none transition-[color,box-shadow,border-color] duration-300 ease-out ${hasError ? "border-red-500" : currentTheme.inputBorder} ${pickerSurfaceClassName} ${currentTheme.text} hover:${currentTheme.borderHover} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10 focus-visible:outline-none focus-visible:border-transparent focus-visible:ring-2 ${currentTheme.focus} data-[state=open]:border-transparent data-[state=open]:ring-2 ${currentTheme.ring}`}
            >
              <CalendarDays className={`h-4 w-4 shrink-0 ${triggerIconClassName}`} />
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className={`text-sm font-normal ${triggerTextClassName}`}>
                  {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : placeholder}
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 ${currentTheme.textMuted}`} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {selectedDate ? "Change due date" : "Pick a due date"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={`w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-2 p-0 ${currentTheme.inputBorder} ${pickerPopoverSurfaceClassName} ${pickerShadowClassName}`}
      >
        <div className={`rounded-[inherit] p-4 ${pickerSurfaceClassName}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className={`text-sm font-semibold ${currentTheme.text}`}>Choose a due date</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <UtilityIconButton
                  type="button"
                  size="sm"
                  emphasis="elevated"
                  onClick={() => onChange("")}
                  className={`${subtleActionButtonClassName} ${selectedDate ? "" : "pointer-events-none invisible"}`}
                  aria-hidden={!selectedDate}
                  tabIndex={selectedDate ? 0 : -1}
                >
                  Clear
                </UtilityIconButton>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>Clear due date</TooltipContent>
            </Tooltip>
          </div>

          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {QUICK_DATE_PRESETS.map((preset) => {
              const presetValue = format(preset.getValue(), "yyyy-MM-dd");
              const isSelected = value === presetValue;

              return (
                <Tooltip key={preset.label}>
                  <TooltipTrigger asChild>
                    <UtilityIconButton
                      type="button"
                      size="sm"
                      emphasis="elevated"
                      onClick={() => onChange(presetValue)}
                      className={
                        isSelected
                          ? selectedActionButtonClassName
                          : subtleActionButtonClassName
                      }
                    >
                      {preset.label}
                    </UtilityIconButton>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {isSelected ? `${preset.label} selected` : `Set due date to ${preset.label.toLowerCase()}`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <div className={`flex justify-center overflow-hidden rounded-2xl border ${currentTheme.inputBorder} ${pickerSurfaceClassName}`}>
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate ?? minimumSelectableDate}
              disabled={{ before: minimumSelectableDate, after: maximumSelectableDate }}
              onSelect={(nextDate) => onChange(nextDate ? format(nextDate, "yyyy-MM-dd") : "")}
              className={`mx-auto ${pickerSurfaceClassName} [--cell-size:2.25rem]`}
              classNames={{
                caption_label: `text-sm font-semibold ${currentTheme.text}`,
                head_cell: `w-9 rounded-md text-[0.75rem] font-medium ${currentTheme.textMuted}`,
                nav_button: `inline-flex size-7 items-center justify-center rounded-lg border ${currentTheme.inputBorder} ${pickerSurfaceClassName} p-0 opacity-100 transition-colors ${currentTheme.textSecondary} hover:${currentTheme.primaryBg} hover:${currentTheme.primaryText}`,
                day: `h-9 w-9 rounded-xl p-0 text-sm font-medium transition-colors ${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${currentTheme.focus}`,
                day_today: `${currentTheme.text} ${currentTheme.primaryBg} brightness-[0.98] dark:brightness-90`,
                day_selected: `!bg-gradient-to-r ${currentTheme.primary} ${isDarkMode ? "!text-gray-900" : "!text-white"} shadow-sm hover:brightness-105 focus:brightness-105`,
                day_outside: `${currentTheme.textMuted} opacity-50`,
                day_disabled: `${currentTheme.textMuted} opacity-30`,
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
