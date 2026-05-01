import { FormEvent, useMemo, useState } from "react";
import { MessageSquareMore, Pencil, Save, Trash2, X } from "lucide-react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import {
  createTaskComment,
  deleteTaskComment,
  TaskComment,
  updateTaskComment,
} from "../../utils/cards";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface TaskCommentThreadProps {
  boardId: number;
  taskId: number;
  comments: TaskComment[];
  onCommentsChange: (comments: TaskComment[]) => void;
}

function formatCommentTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function TaskCommentThread({
  boardId,
  taskId,
  comments,
  onCommentsChange,
}: TaskCommentThreadProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const dividerClassName = isDarkMode ? "border-white/10" : "border-slate-200/80";
  const [draft, setDraft] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const orderedComments = useMemo(
    () => [...comments].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    [comments],
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedDraft = draft.trim();

    if (!normalizedDraft) {
      setSubmitError("Write a comment before posting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      const createdComment = await createTaskComment(boardId, taskId, normalizedDraft);
      onCommentsChange([...orderedComments, createdComment]);
      setDraft("");
      showSuccessToast("Comment added.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add the comment right now.";
      setSubmitError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setSubmitError("");
  };

  const handleSaveEdit = async (commentId: number) => {
    const normalizedContent = editingContent.trim();
    if (!normalizedContent) {
      setSubmitError("Comment content is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      const updatedComment = await updateTaskComment(boardId, taskId, commentId, normalizedContent);
      onCommentsChange(orderedComments.map((comment) => comment.id === updatedComment.id ? updatedComment : comment));
      setEditingCommentId(null);
      setEditingContent("");
      showSuccessToast("Comment updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the comment right now.";
      setSubmitError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (pendingDeleteId !== commentId) {
      setPendingDeleteId(commentId);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      await deleteTaskComment(boardId, taskId, commentId);
      onCommentsChange(orderedComments.filter((comment) => comment.id !== commentId));
      setPendingDeleteId(null);
      showSuccessToast("Comment deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete the comment right now.";
      setSubmitError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden">
      <div className={`border-b px-6 py-5 ${dividerClassName}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r ${currentTheme.primary}`}>
            <MessageSquareMore className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${currentTheme.text}`}>Comments</h2>
            <p className={`mt-1 text-sm ${currentTheme.textMuted}`}>
              Keep task discussion in one place for the whole board.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleCreate} className="space-y-3">
          <label htmlFor="task-comment-draft" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
            New comment
          </label>
          <textarea
            id="task-comment-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add context, feedback, or the next step for this task..."
            rows={4}
            className={`w-full rounded-2xl border px-4 py-3 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} placeholder:${currentTheme.textMuted} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
          />
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs ${currentTheme.textMuted}`}>Comments are visible to all board members.</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${currentTheme.primary}`}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>

        {submitError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className={`mt-6 border-t pt-4 ${dividerClassName}`}>
          {orderedComments.length === 0 ? (
            <div className={`px-2 py-10 text-center ${currentTheme.textMuted}`}>
              <p className={`text-sm ${currentTheme.textMuted}`}>No comments yet. Start the conversation for this task.</p>
            </div>
          ) : (
            <div>
              {orderedComments.map((comment) => {
                const isEditing = editingCommentId === comment.id;
                const wasEdited = Boolean(comment.updatedAt && comment.updatedAt !== comment.createdAt);

                return (
                  <article key={comment.id} className={`px-1 py-5 ${dividerClassName} ${orderedComments[orderedComments.length - 1]?.id !== comment.id ? "border-b" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${currentTheme.text}`}>{comment.author.displayName || comment.author.name}</p>
                        <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${currentTheme.textMuted}`}>
                          <span>{formatCommentTimestamp(comment.createdAt)}</span>
                          {wasEdited && <span className={`rounded-full border px-2 py-0.5 ${dividerClassName}`}>Edited</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {comment.canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(comment)}
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${dividerClassName} ${currentTheme.textSecondary}`}
                                aria-label={`Edit comment from ${comment.author.displayName || comment.author.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>Edit comment</TooltipContent>
                          </Tooltip>
                        )}
                        {comment.canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => void handleDelete(comment.id)}
                                className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium ${pendingDeleteId === comment.id ? "border-red-400 text-red-600" : `${dividerClassName} ${currentTheme.textSecondary}`}`}
                                aria-label={`Delete comment from ${comment.author.displayName || comment.author.name}`}
                              >
                                {pendingDeleteId === comment.id ? "Confirm delete" : <Trash2 className="h-4 w-4" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              {pendingDeleteId === comment.id ? "Click again to confirm delete" : "Delete comment"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          rows={4}
                          className={`w-full rounded-2xl border px-4 py-3 ${currentTheme.inputBorder} ${currentTheme.inputBg} ${currentTheme.text} focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingContent("");
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${dividerClassName} ${currentTheme.textSecondary}`}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(comment.id)}
                            disabled={isSubmitting}
                            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${currentTheme.primary}`}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`mt-4 whitespace-pre-wrap text-sm leading-6 ${currentTheme.textSecondary}`}>
                        {comment.content}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
