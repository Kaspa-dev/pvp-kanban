import { X, Calendar, Zap } from "lucide-react";
import { useState } from "react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";

interface EditSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  onSave: (sprint: { name: string; startDate: string; endDate: string }) => void;
}

function getDefaultSprintDates() {
  const today = new Date();
  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return { startDate, endDate };
}

function getInitialSprintDraft(sprint: EditSprintModalProps["sprint"]) {
  const defaults = getDefaultSprintDates();
  return {
    sprintName: sprint?.name ?? "Sprint 1",
    startDate: sprint?.startDate ?? defaults.startDate,
    endDate: sprint?.endDate ?? defaults.endDate,
  };
}

export function EditSprintModal({ isOpen, onClose, sprint, onSave }: EditSprintModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const initialDraft = getInitialSprintDraft(sprint);

  const [sprintName, setSprintName] = useState(initialDraft.sprintName);
  const [startDate, setStartDate] = useState(initialDraft.startDate);
  const [endDate, setEndDate] = useState(initialDraft.endDate);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!sprintName.trim()) {
      alert("Please enter a sprint name");
      return;
    }

    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      alert("End date must be after start date");
      return;
    }

    onSave({
      name: sprintName.trim(),
      startDate,
      endDate,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative ${currentTheme.cardBg} rounded-3xl shadow-2xl w-full max-w-lg p-8 border-2 ${currentTheme.border} animate-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${currentTheme.primary}`}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${currentTheme.text}`}>
              {sprint ? "Edit Sprint" : "Create Sprint"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`${currentTheme.textMuted} hover:${currentTheme.text} transition-colors hover:${currentTheme.bgSecondary} rounded-full p-2`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${currentTheme.text}`}>
              Sprint Name *
            </label>
            <input
              type="text"
              value={sprintName}
              onChange={(event) => setSprintName(event.target.value)}
              placeholder="e.g., Sprint 1, Q1 Sprint, Feature Release"
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${currentTheme.text}`}>
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${currentTheme.text}`}>
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date / Deadline *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={`w-full px-4 py-3 border-2 ${currentTheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent transition-all ${currentTheme.inputBg} ${currentTheme.text}`}
              required
            />
          </div>

          {startDate && endDate && new Date(endDate) > new Date(startDate) && (
            <div className={`p-4 rounded-xl ${currentTheme.bgSecondary} ${currentTheme.textSecondary} text-sm`}>
              <p className="font-medium mb-1">Sprint Duration</p>
              <p>
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 ${currentTheme.bgTertiary} ${currentTheme.text} font-semibold rounded-xl hover:scale-105 transition-all`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              {sprint ? "Save Changes" : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
