import { useState } from 'react';
import { X, Calendar, Play, AlertCircle } from 'lucide-react';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { Sprint, createSprint, startSprint } from '../utils/sprints';

interface SprintPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  onSprintCreated: (sprint: Sprint) => void;
  onSprintStarted: (sprint: Sprint) => void;
  existingSprint?: Sprint | null;
}

export function SprintPlanningModal({
  isOpen,
  onClose,
  boardId,
  onSprintCreated,
  onSprintStarted,
  existingSprint,
}: SprintPlanningModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [sprintName, setSprintName] = useState(existingSprint?.name || '');
  const [startDate, setStartDate] = useState(
    existingSprint?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    existingSprint?.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sprintName.trim()) {
      setError('Sprint name is required');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    if (existingSprint) {
      // Start existing sprint
      startSprint(existingSprint.id);
      onSprintStarted(existingSprint);
    } else {
      // Create new sprint
      const newSprint = createSprint(boardId, sprintName, startDate, endDate);
      onSprintCreated(newSprint);
    }

    onClose();
  };

  const getDuration = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border ${currentTheme.border}`}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b ${currentTheme.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-bold ${currentTheme.text}`}>
              {existingSprint ? 'Start Sprint' : 'Create Sprint'}
            </h2>
            <p className={`text-sm ${currentTheme.textMuted} mt-1`}>
              {existingSprint
                ? 'Review sprint details and start working'
                : 'Plan your next sprint cycle'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:${currentTheme.bgTertiary} rounded-lg transition-colors`}
          >
            <X className={`w-5 h-5 ${currentTheme.textSecondary}`} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Sprint Name */}
          <div>
            <label className={`block text-sm font-semibold ${currentTheme.text} mb-2`}>
              Sprint Name *
            </label>
            <input
              type="text"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              placeholder="e.g., Sprint 1, Q1 Sprint, MVP Release"
              disabled={!!existingSprint}
              className={`w-full px-4 py-3 ${
                isDarkMode ? 'bg-[#242830] border-gray-700' : 'bg-white border-gray-200'
              } border rounded-lg ${currentTheme.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.focus} ${currentTheme.primaryBorder}`}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${currentTheme.text} mb-2`}>
                Start Date *
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textMuted} pointer-events-none`} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!!existingSprint}
                  className={`w-full pl-10 pr-4 py-3 ${
                    isDarkMode ? 'bg-[#242830] border-gray-700' : 'bg-white border-gray-200'
                  } border rounded-lg ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.focus} ${currentTheme.primaryBorder}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${currentTheme.text} mb-2`}>
                End Date *
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textMuted} pointer-events-none`} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!!existingSprint}
                  className={`w-full pl-10 pr-4 py-3 ${
                    isDarkMode ? 'bg-[#242830] border-gray-700' : 'bg-white border-gray-200'
                  } border rounded-lg ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.focus} ${currentTheme.primaryBorder}`}
                />
              </div>
            </div>
          </div>

          {/* Duration Info */}
          <div className={`flex items-center gap-3 px-4 py-3 ${currentTheme.bgSecondary} rounded-lg border ${currentTheme.border}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm font-medium ${currentTheme.text}`}>Sprint Duration</p>
              <p className={`text-xs ${currentTheme.textMuted}`}>
                {getDuration()} days ({Math.ceil(getDuration() / 7)} weeks)
              </p>
            </div>
          </div>

          {existingSprint && (
            <div className={`px-4 py-3 bg-gradient-to-r ${currentTheme.primarySoft} border ${currentTheme.primaryBorder} rounded-lg`}>
              <p className={`text-sm ${currentTheme.text}`}>
                <strong>Note:</strong> Starting this sprint will make all planned tasks visible in Board and List views.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 ${currentTheme.bgSecondary} ${currentTheme.textSecondary} font-semibold rounded-lg hover:${currentTheme.bgTertiary} transition-all border ${currentTheme.border}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all flex items-center justify-center gap-2`}
            >
              {existingSprint ? (
                <>
                  <Play className="w-5 h-5" />
                  Start Sprint
                </>
              ) : (
                'Create Sprint'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
