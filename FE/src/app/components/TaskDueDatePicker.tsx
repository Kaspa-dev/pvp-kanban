import { CalendarDays, ChevronDown } from "lucide-react";
import { addDays, format, isValid, parseISO, startOfToday } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";

interface TaskDueDatePickerProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
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
}: TaskDueDatePickerProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const selectedDate = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={selectedDate ? `Due date ${format(selectedDate, "MMMM d, yyyy")}` : "Choose due date"}
          className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent hover:${currentTheme.borderHover}`}
        >
          <CalendarDays className={`h-4 w-4 shrink-0 ${selectedDate ? currentTheme.textSecondary : currentTheme.textMuted}`} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            <span className={selectedDate ? currentTheme.text : currentTheme.textMuted}>
              {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : placeholder}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 ${currentTheme.textMuted}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className={`w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-2 p-0 shadow-2xl ${currentTheme.cardBg} ${currentTheme.border}`}
      >
        <div className="p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-semibold ${currentTheme.text}`}>Choose a due date</p>
              <p className={`mt-1 text-xs ${currentTheme.textMuted}`}>
                Pick a day or use a quick shortcut.
              </p>
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => onChange("")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${currentTheme.primaryText} ${currentTheme.primaryBg} hover:opacity-90`}
              >
                Clear
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {QUICK_DATE_PRESETS.map((preset) => {
              const presetValue = format(preset.getValue(), "yyyy-MM-dd");
              const isSelected = value === presetValue;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange(presetValue)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                      : `${currentTheme.bgSecondary} ${currentTheme.textSecondary} hover:${currentTheme.inputBg}`
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className={`flex justify-center overflow-hidden rounded-2xl border ${currentTheme.inputBorder}`}>
            <Calendar
              mode="single"
              selected={selectedDate}
              month={selectedDate}
              onSelect={(nextDate) => onChange(nextDate ? format(nextDate, "yyyy-MM-dd") : "")}
              className={`mx-auto ${currentTheme.cardBg} [--cell-size:2.25rem]`}
              classNames={{
                caption_label: `text-sm font-semibold ${currentTheme.text}`,
                head_cell: `w-9 rounded-md text-[0.75rem] font-medium ${currentTheme.textMuted}`,
                day: `h-9 w-9 rounded-xl p-0 text-sm font-medium ${currentTheme.text}`,
                day_today: `${currentTheme.primaryBg} ${currentTheme.primaryText}`,
                day_selected: `bg-gradient-to-r ${currentTheme.primary} text-white hover:bg-none hover:text-white focus:bg-none focus:text-white`,
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
