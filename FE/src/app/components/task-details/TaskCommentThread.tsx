import { FormEvent, useMemo, useState } from "react";
import { Pencil, Save, Send, Trash2, X } from "lucide-react";
import { getThemeColors, useTheme } from "../../contexts/ThemeContext";
import {
  createTaskComment,
  deleteTaskComment,
  TaskComment,
  updateTaskComment,
} from "../../utils/cards";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { AppAvatar } from "../AppAvatar";
import { getNativeInputFieldClassName } from "../inputLikeControlStyles";
import { UtilityIconButton } from "../UtilityIconButton";
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
  const inputSurfaceClassName = isDarkMode ? currentTheme.inputBg : "bg-input-background";
  const commentInputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: inputSurfaceClassName,
  });
  const secondaryButtonClassName = `inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-[border-color,box-shadow,color,background-color] duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.inputBorder} ${inputSurfaceClassName} ${currentTheme.textSecondary} hover:${currentTheme.borderHover} hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] dark:hover:shadow-[0_0_0_1px_color-mix(in_srgb,white_12%,transparent)]`;
  const primaryButtonClassName = `group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg ${currentTheme.focus} ${currentTheme.primary}`;
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
    setPendingDeleteId(null);
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
    <section className={`overflow-hidden rounded-[2rem] border ${currentTheme.border} ${currentTheme.cardBg} shadow-[0_24px_70px_-46px_rgba(15,23,42,0.48)]`}>
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b px-5 py-5 sm:px-6 ${dividerClassName}`}>
        <div>
          <h2 className={`font-ui-condensed text-2xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>Comments</h2>
          <p className={`font-due-date mt-1 text-xs ${currentTheme.textMuted}`}>
            {orderedComments.length} {orderedComments.length === 1 ? "comment" : "comments"}
          </p>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <form onSubmit={handleCreate} className="space-y-3">
          <label htmlFor="task-comment-draft" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
            New comment
          </label>
          <textarea
            id="task-comment-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a comment..."
            rows={4}
            className={`min-h-28 w-full resize-y px-4 py-3 placeholder:${currentTheme.textMuted} ${commentInputClassName}`}
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClassName}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>

        {submitError && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              isDarkMode
                ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="alert"
          >
            {submitError}
          </div>
        )}

        <div className={`mt-6 border-t ${dividerClassName}`}>
          {orderedComments.length === 0 ? (
            <div className={`px-1 py-8 text-sm ${currentTheme.textMuted}`}>
              No comments yet.
            </div>
          ) : (
            <div>
              {orderedComments.map((comment) => {
                const isEditing = editingCommentId === comment.id;
                const wasEdited = Boolean(comment.updatedAt && comment.updatedAt !== comment.createdAt);
                const authorName = comment.author.displayName || comment.author.name;

                return (
                  <article key={comment.id} className={`py-5 ${dividerClassName} ${orderedComments[orderedComments.length - 1]?.id !== comment.id ? "border-b" : ""}`}>
                    <div className="flex gap-3">
                      <AppAvatar
                        username={comment.author.username || authorName}
                        fullName={authorName}
                        size={36}
                        interactive={false}
                        enableBlink={false}
                        level={comment.author.currentLevel}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>{authorName}</p>
                            <div className={`mt-1 flex flex-wrap items-center gap-2 ${currentTheme.textMuted}`}>
                              <time className="font-due-date text-xs" dateTime={comment.createdAt}>
                                {formatCommentTimestamp(comment.createdAt)}
                              </time>
                              {wasEdited && (
                                <span className={`font-due-date rounded-full border px-2 py-0.5 text-[11px] ${currentTheme.border}`}>
                                  Edited
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {comment.canEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <UtilityIconButton
                                    type="button"
                                    size="md"
                                    onClick={() => handleStartEdit(comment)}
                                    aria-label={`Edit comment from ${authorName}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </UtilityIconButton>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>Edit comment</TooltipContent>
                              </Tooltip>
                            )}
                            {comment.canDelete && (
                              pendingDeleteId === comment.id ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => void handleDelete(comment.id)}
                                      className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                                        isDarkMode
                                          ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                                          : "border-rose-200 bg-rose-50 text-rose-700"
                                      }`}
                                      aria-label={`Confirm delete comment from ${authorName}`}
                                    >
                                      Confirm
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8}>Delete comment</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <UtilityIconButton
                                      type="button"
                                      size="md"
                                      onClick={() => void handleDelete(comment.id)}
                                      aria-label={`Delete comment from ${authorName}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </UtilityIconButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8}>Delete comment</TooltipContent>
                                </Tooltip>
                              )
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-4 space-y-3">
                            <textarea
                              value={editingContent}
                              onChange={(event) => setEditingContent(event.target.value)}
                              rows={4}
                              className={`min-h-28 w-full resize-y px-4 py-3 ${commentInputClassName}`}
                            />
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingContent("");
                                }}
                                className={secondaryButtonClassName}
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSaveEdit(comment.id)}
                                disabled={isSubmitting}
                                className={primaryButtonClassName}
                              >
                                <Save className="h-4 w-4" aria-hidden="true" />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`mt-4 whitespace-pre-wrap text-sm leading-7 ${currentTheme.textSecondary}`}>
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
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
