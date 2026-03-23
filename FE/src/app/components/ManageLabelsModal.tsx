import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { Label, LABEL_COLORS } from '../utils/labels';

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onCreateLabel: (name: string, color: string) => void;
  onUpdateLabel: (labelId: string, name: string, color: string) => void;
  onDeleteLabel: (labelId: string) => void;
}

export function ManageLabelsModal({
  isOpen,
  onClose,
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: ManageLabelsModalProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);

  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newLabelName.trim()) return;

    onCreateLabel(newLabelName.trim(), newLabelColor);
    setNewLabelName('');
    setNewLabelColor(LABEL_COLORS[0]);
  };

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;

    onUpdateLabel(editingId, editName.trim(), editColor);
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDelete = (labelId: string) => {
    if (confirm('Delete this label? It will be removed from all tasks.')) {
      onDeleteLabel(labelId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`${currentTheme.cardBg} border-b-2 ${currentTheme.border} px-6 py-4 flex items-center justify-between`}>
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Manage Labels</h2>
          <button
            onClick={onClose}
            className={`p-2 hover:${currentTheme.bgSecondary} rounded-xl transition-colors`}
          >
            <X className={`w-5 h-5 ${currentTheme.textMuted}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Label */}
          <div className={`mb-6 p-4 ${currentTheme.bgSecondary} rounded-xl border-2 ${currentTheme.border}`}>
            <h3 className={`text-sm font-bold ${currentTheme.textSecondary} mb-3`}>Create New Label</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Label name"
                className={`flex-1 px-3 py-2 border-2 ${currentTheme.inputBorder} rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus} focus:border-transparent ${currentTheme.inputBg} ${currentTheme.text}`}
              />
              
              {/* Color Picker */}
              <div className="flex gap-1.5 flex-wrap max-w-xs">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      newLabelColor === color ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <button
                onClick={handleCreate}
                disabled={!newLabelName.trim()}
                className={`px-4 py-2 bg-gradient-to-r ${currentTheme.primary} text-white font-semibold rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Labels List */}
          <div>
            <h3 className={`text-sm font-bold ${currentTheme.textSecondary} mb-3`}>Existing Labels</h3>
            {labels.length === 0 ? (
              <p className={`${currentTheme.textMuted} text-center py-8 italic`}>No labels yet. Create your first one above!</p>
            ) : (
              <div className="space-y-2">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className={`flex items-center gap-3 p-3 ${currentTheme.cardBg} border-2 ${currentTheme.border} rounded-xl hover:${currentTheme.borderHover} transition-colors`}
                  >
                    {editingId === label.id ? (
                      <>
                        {/* Editing Mode */}
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          className={`flex-1 px-3 py-1.5 border-2 ${currentTheme.inputBorder} rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus} ${currentTheme.inputBg} ${currentTheme.text}`}
                          autoFocus
                        />
                        
                        {/* Color Picker for Edit */}
                        <div className="flex gap-1 flex-wrap max-w-xs">
                          {LABEL_COLORS.slice(0, 7).map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={`w-6 h-6 rounded transition-all ${
                                editColor === color ? 'ring-2 ring-gray-900 ring-offset-1 scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <button
                          onClick={handleSaveEdit}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={`p-2 hover:${currentTheme.bgSecondary} rounded-lg transition-colors`}
                          title="Cancel"
                        >
                          <X className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Display Mode */}
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className={`flex-1 font-medium ${currentTheme.text}`}>{label.name}</span>
                        
                        <button
                          onClick={() => handleStartEdit(label)}
                          className={`p-2 hover:${currentTheme.bgSecondary} rounded-lg transition-colors`}
                          title="Edit"
                        >
                          <Edit2 className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(label.id)}
                          className={`p-2 ${currentTheme.isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} rounded-lg transition-colors`}
                          title="Delete"
                        >
                          <Trash2 className={`w-4 h-4 ${currentTheme.isDark ? 'text-red-400' : 'text-red-600'}`} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2.5 bg-gradient-to-r ${currentTheme.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
