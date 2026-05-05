import { Check, ChevronDown, Columns3, Fingerprint, HelpCircle, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getThemeColors, useTheme } from "../contexts/ThemeContext";
import {
  BOARD_LOGO_COLOR_OPTIONS,
  BOARD_LOGO_ICON_OPTIONS,
  BoardLogoColorKey,
  BoardLogoIconKey,
  DEFAULT_BOARD_LOGO_COLOR_KEY,
  DEFAULT_BOARD_LOGO_ICON_KEY,
} from "../utils/boardIdentity";
import { Board, BoardColumnLimit, EditableBoardWorkflowStatusKey } from "../utils/boards";
import { ProjectUser } from "../utils/users";
import { BoardLogo } from "./BoardLogo";
import { BoardMemberListItem } from "./BoardMemberListItem";
import { BoardStatusBadge } from "./BoardStatusBadge";
import { UserSearchPicker } from "./UserSearchPicker";
import { UtilityIconButton } from "./UtilityIconButton";
import { getIconActionButtonClassName } from "./iconActionButtonStyles";
import { getInputLikeControlClassName, getNativeInputFieldClassName } from "./inputLikeControlStyles";
import {
  getPrimaryModalActionButtonClassName,
  getSecondaryModalActionButtonClassName,
} from "./modalActionButtonStyles";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { showErrorToast, showSuccessToast } from "../utils/toast";

const MAX_BOARD_MEMBERS = 20;
const MAX_BOARD_NAME_LENGTH = 128;
const MAX_BOARD_DESCRIPTION_LENGTH = 500;
const MAX_BOARD_COLUMN_LIMIT = 20;
const BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS = "min-h-24";
const fieldSurfaceClassName = "bg-input-background dark:bg-input/30";
const BOARD_SETTINGS_ACCORDION_SECTIONS = ["general", "column-limits", "members"];
const EDITABLE_COLUMN_LIMITS: ReadonlyArray<{
  statusKey: EditableBoardWorkflowStatusKey;
  label: string;
}> = [
  { statusKey: "todo", label: "To Do" },
  { statusKey: "inProgress", label: "In Progress" },
  { statusKey: "inReview", label: "In Review" },
  { statusKey: "done", label: "Done" },
];

interface BoardSettingsDraft {
  name: string;
  description: string;
  logoIconKey: BoardLogoIconKey;
  logoColorKey: BoardLogoColorKey;
  memberUserIds: number[];
  columnLimits: BoardColumnLimit[];
}

interface BoardColumnLimitInputDraft {
  statusKey: EditableBoardWorkflowStatusKey;
  softLimit: string;
  hardLimit: string;
}

interface BoardSettingsPageProps {
  board: Board;
  onSave: (updates: BoardSettingsDraft) => Promise<void>;
}

function getInitialBoardSettingsDraft(board: Board): BoardSettingsDraft {
  return {
    name: board.name,
    description: board.description ?? "",
    logoIconKey: board.logoIconKey ?? DEFAULT_BOARD_LOGO_ICON_KEY,
    logoColorKey: board.logoColorKey ?? DEFAULT_BOARD_LOGO_COLOR_KEY,
    memberUserIds: board.members.map((member) => member.userId),
    columnLimits: EDITABLE_COLUMN_LIMITS.map(({ statusKey }) => ({
      statusKey,
      softLimit: board.columnLimits[statusKey]?.softLimit ?? null,
      hardLimit: board.columnLimits[statusKey]?.hardLimit ?? null,
    })),
  };
}

function getInitialMemberDirectory(board: Board): Record<number, ProjectUser> {
  return board.members.reduce<Record<number, ProjectUser>>((accumulator, member) => {
    accumulator[member.userId] = {
      id: member.userId,
      username: member.username,
      displayName: member.displayName,
      email: member.email,
    };

    return accumulator;
  }, {});
}

function haveSameMemberIds(left: number[], right: number[]) {
  if (left.length !== right.length) {
    return false;
  }

  const normalizedLeft = [...left].sort((a, b) => a - b);
  const normalizedRight = [...right].sort((a, b) => a - b);

  return normalizedLeft.every((userId, index) => userId === normalizedRight[index]);
}

function haveSameColumnLimits(left: BoardColumnLimit[], right: BoardColumnLimit[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((leftLimit, index) => {
    const rightLimit = right[index];
    return (
      leftLimit.statusKey === rightLimit.statusKey &&
      leftLimit.softLimit === rightLimit.softLimit &&
      leftLimit.hardLimit === rightLimit.hardLimit
    );
  });
}

function getColumnLimitInputDrafts(columnLimits: BoardColumnLimit[]): BoardColumnLimitInputDraft[] {
  return columnLimits.map((limit) => ({
    statusKey: limit.statusKey,
    softLimit: limit.softLimit == null ? "" : String(limit.softLimit),
    hardLimit: limit.hardLimit == null ? "" : String(limit.hardLimit),
  }));
}

function parseColumnLimitValue(rawValue: string): { value: number | null; error: string | null } {
  const normalizedValue = rawValue.trim();
  if (!normalizedValue) {
    return { value: null, error: null };
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return { value: null, error: `Use values between 1 and ${MAX_BOARD_COLUMN_LIMIT} or leave blank.` };
  }

  const parsedValue = Number(normalizedValue);
  if (parsedValue < 1 || parsedValue > MAX_BOARD_COLUMN_LIMIT) {
    return { value: null, error: `Use values between 1 and ${MAX_BOARD_COLUMN_LIMIT} or leave blank.` };
  }

  return { value: parsedValue, error: null };
}

export function BoardSettingsPage({ board, onSave }: BoardSettingsPageProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const secondaryActionButtonClassName = getSecondaryModalActionButtonClassName(
    currentTheme,
    currentTheme.text,
  );

  const initialDraft = useMemo(() => getInitialBoardSettingsDraft(board), [board]);
  const initialDirectory = useMemo(() => getInitialMemberDirectory(board), [board]);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(initialDraft.name);
  const [description, setDescription] = useState(initialDraft.description);
  const [logoIconKey, setLogoIconKey] = useState<BoardLogoIconKey>(initialDraft.logoIconKey);
  const [logoColorKey, setLogoColorKey] = useState<BoardLogoColorKey>(initialDraft.logoColorKey);
  const [memberUserIds, setMemberUserIds] = useState<number[]>(initialDraft.memberUserIds);
  const [columnLimitInputs, setColumnLimitInputs] = useState<BoardColumnLimitInputDraft[]>(
    getColumnLimitInputDrafts(initialDraft.columnLimits),
  );
  const [memberDirectory, setMemberDirectory] = useState<Record<number, ProjectUser>>(initialDirectory);
  const [showError, setShowError] = useState(false);
  const [hasTouchedName, setHasTouchedName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSettingsSections, setOpenSettingsSections] = useState<string[]>([
    ...BOARD_SETTINGS_ACCORDION_SECTIONS,
  ]);

  useEffect(() => {
    setName(initialDraft.name);
    setDescription(initialDraft.description);
    setLogoIconKey(initialDraft.logoIconKey);
    setLogoColorKey(initialDraft.logoColorKey);
    setMemberUserIds(initialDraft.memberUserIds);
    setColumnLimitInputs(getColumnLimitInputDrafts(initialDraft.columnLimits));
    setMemberDirectory(initialDirectory);
    setShowError(false);
    setHasTouchedName(false);
    setIsSubmitting(false);
    setOpenSettingsSections([...BOARD_SETTINGS_ACCORDION_SECTIONS]);
  }, [initialDirectory, initialDraft]);

  const members = useMemo(
    () =>
      memberUserIds
        .map((userId) => {
          const existingMember = board.members.find((member) => member.userId === userId);
          if (existingMember) {
            return existingMember;
          }

          const user = memberDirectory[userId];
          if (!user) {
            return null;
          }

          return {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            color: "#64748b",
            role: "member" as const,
            name: user.displayName,
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null),
    [board.members, memberDirectory, memberUserIds],
  );

  const totalMemberCount = members.length;
  const hasReachedMemberLimit = totalMemberCount >= MAX_BOARD_MEMBERS;
  const shouldShowNameError = (showError || hasTouchedName) && !name.trim();
  const normalizedColumnLimitRows = useMemo(
    () =>
      columnLimitInputs.map((input) => {
        const softLimitResult = parseColumnLimitValue(input.softLimit);
        const hardLimitResult = parseColumnLimitValue(input.hardLimit);
        const hardLimitError =
          hardLimitResult.error ??
          (softLimitResult.error || hardLimitResult.value == null || softLimitResult.value == null
            ? null
            : hardLimitResult.value < softLimitResult.value
              ? "Hard limit must be at least the soft limit."
              : null);

        return {
          ...input,
          normalizedLimit: {
            statusKey: input.statusKey,
            softLimit: softLimitResult.value,
            hardLimit: hardLimitResult.value,
          } satisfies BoardColumnLimit,
          softLimitError: softLimitResult.error,
          hardLimitError,
        };
      }),
    [columnLimitInputs],
  );
  const hasColumnLimitErrors = normalizedColumnLimitRows.some(
    (row) => Boolean(row.softLimitError) || Boolean(row.hardLimitError),
  );
  const normalizedColumnLimits = normalizedColumnLimitRows.map((row) => row.normalizedLimit);
  const isDirty =
    name.trim() !== initialDraft.name ||
    description.trim() !== initialDraft.description ||
    logoIconKey !== initialDraft.logoIconKey ||
    logoColorKey !== initialDraft.logoColorKey ||
    !haveSameMemberIds(memberUserIds, initialDraft.memberUserIds) ||
    !haveSameColumnLimits(normalizedColumnLimits, initialDraft.columnLimits);

  const nameInputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: fieldSurfaceClassName,
  });
  const iconOptionSurfaceClassName = fieldSurfaceClassName;
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const subtleUtilityButtonClassName = `w-auto gap-1.5 px-2.5 text-xs font-semibold shadow-none border-transparent bg-transparent ${currentTheme.textSecondary}`;
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const accordionTriggerClassName = `group items-center rounded-none py-0 hover:no-underline`;
  const accordionIndicator = (
    <span
      aria-hidden="true"
      className={`${getIconActionButtonClassName(currentTheme, {
        size: "sm",
        emphasis: "default",
      })} shrink-0`}
    >
      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </span>
  );
  const focusNameField = () => {
    window.requestAnimationFrame(() => {
      nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInputRef.current?.focus();
    });
  };
  const areAllSettingsSectionsOpen = BOARD_SETTINGS_ACCORDION_SECTIONS.every((section) =>
    openSettingsSections.includes(section),
  );

  const toggleAllSettingsSections = () => {
    setOpenSettingsSections(areAllSettingsSectionsOpen ? [] : [...BOARD_SETTINGS_ACCORDION_SECTIONS]);
  };

  const resetDraft = () => {
    setName(initialDraft.name);
    setDescription(initialDraft.description);
    setLogoIconKey(initialDraft.logoIconKey);
    setLogoColorKey(initialDraft.logoColorKey);
    setMemberUserIds(initialDraft.memberUserIds);
    setColumnLimitInputs(getColumnLimitInputDrafts(initialDraft.columnLimits));
    setMemberDirectory(initialDirectory);
    setShowError(false);
    setHasTouchedName(false);
    setIsSubmitting(false);
    setOpenSettingsSections([...BOARD_SETTINGS_ACCORDION_SECTIONS]);
  };

  const handleAddMember = (projectUser: ProjectUser) => {
    if (hasReachedMemberLimit) {
      return;
    }

    setMemberDirectory((previous) => ({
      ...previous,
      [projectUser.id]: projectUser,
    }));
    setMemberUserIds((previous) =>
      previous.includes(projectUser.id) ? previous : [...previous, projectUser.id],
    );
  };

  const handleRemoveMember = (userId: number) => {
    const member = board.members.find((item) => item.userId === userId);
    if (member?.role === "owner") {
      return;
    }

    setMemberUserIds((previous) => previous.filter((memberId) => memberId !== userId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setShowError(true);
      focusNameField();
      return;
    }

    if (hasColumnLimitErrors) {
      return;
    }

    if (!isDirty) {
      showSuccessToast("No board settings changes to save.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: trimmedName,
        description: trimmedDescription,
        logoIconKey,
        logoColorKey,
        memberUserIds,
        columnLimits: normalizedColumnLimits,
      });
      showSuccessToast("Board settings saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save board settings.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`flex min-h-0 flex-1 flex-col overflow-hidden ${currentTheme.bgSecondary}`}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-8 py-6 lg:px-10 xl:px-12">
            <header className="space-y-1">
              <h1 className={`font-ui-condensed text-[2rem] font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Board Settings
              </h1>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={sectionDescriptionClassName}>
                  Update the board identity and member access without leaving the workspace.
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <UtilityIconButton
                      type="button"
                      size="sm"
                      emphasis="elevated"
                      onClick={toggleAllSettingsSections}
                      className={subtleUtilityButtonClassName}
                      aria-label={areAllSettingsSectionsOpen ? "Collapse all board settings sections" : "Expand all board settings sections"}
                    >
                      {areAllSettingsSectionsOpen ? "Collapse all" : "Expand all"}
                    </UtilityIconButton>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {areAllSettingsSectionsOpen ? "Collapse all board settings sections" : "Expand all board settings sections"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </header>

            <Accordion
              type="multiple"
              value={openSettingsSections}
              onValueChange={setOpenSettingsSections}
              className={`border-y ${currentTheme.border}`}
            >
              <AccordionItem value="general" className={`border-b ${currentTheme.border}`}>
                <AccordionTrigger className={accordionTriggerClassName} indicator={accordionIndicator}>
                  <div className="flex min-w-0 flex-1 items-center gap-4 py-5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Fingerprint className={`h-4 w-4 ${currentTheme.primaryText}`} />
                        <h2 className={`text-lg font-semibold ${currentTheme.text}`}>Board Identity</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className={helpIconButtonClassName} aria-label="General settings help">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            Update the board name, description, and visual identity here.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className={sectionDescriptionClassName}>
                        Define how the board is named and recognized across the workspace.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-6">
                  <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="flex h-full flex-col gap-6">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <label htmlFor="board-settings-name" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
                            Name <span className="text-red-500">*</span>
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className={helpIconButtonClassName} aria-label="Board name help">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              Keep it concise and recognizable in navigation, lists, and task context.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <input
                          id="board-settings-name"
                          ref={nameInputRef}
                          type="text"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            if ((showError || hasTouchedName) && event.target.value.trim()) {
                              setShowError(false);
                            }
                          }}
                          onBlur={() => setHasTouchedName(true)}
                          maxLength={MAX_BOARD_NAME_LENGTH}
                          placeholder="Enter board name..."
                          className={`w-full px-4 py-3 ${nameInputClassName} ${shouldShowNameError ? "border-red-500" : ""}`}
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {shouldShowNameError ? (
                            <p className="text-sm text-red-500">Board name is required.</p>
                          ) : (
                            <div />
                          )}
                          <span className={`text-xs ${currentTheme.textMuted}`}>
                            {name.trim().length}/{MAX_BOARD_NAME_LENGTH}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-h-[16rem] flex-1 flex-col">
                        <div className="mb-2 flex items-center gap-2">
                          <label htmlFor="board-settings-description" className={`block text-sm font-semibold ${currentTheme.textSecondary}`}>
                            Description
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className={helpIconButtonClassName} aria-label="Board description help">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              Use this for scope, ownership, or the working agreement behind the board.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <textarea
                          id="board-settings-description"
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          maxLength={MAX_BOARD_DESCRIPTION_LENGTH}
                          placeholder="Describe this board..."
                          rows={4}
                          className={`h-full w-full flex-1 resize-y px-4 py-3 ${BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS} ${getNativeInputFieldClassName(currentTheme, {
                            surfaceClassName: fieldSurfaceClassName,
                          })}`}
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <span className={`text-xs ${currentTheme.textMuted}`}>
                            {description.trim().length}/{MAX_BOARD_DESCRIPTION_LENGTH}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold ${currentTheme.textSecondary}`}>Icon</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className={helpIconButtonClassName} aria-label="Board icon help">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              Choose an icon that helps the board stand out in dense navigation.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                          {BOARD_LOGO_ICON_OPTIONS.map((option) => {
                            const isSelected = option.key === logoIconKey;
                            const iconOptionClassName = getInputLikeControlClassName(currentTheme, {
                              selected: isSelected,
                              surfaceClassName: iconOptionSurfaceClassName,
                            });

                            return (
                              <Tooltip key={option.key}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => setLogoIconKey(option.key)}
                                    aria-pressed={isSelected}
                                    className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-2 px-3 py-3 ${iconOptionClassName}`}
                                  >
                                    <BoardLogo iconKey={option.key} colorKey={logoColorKey} size="xs" />
                                    <span className={`text-[11px] font-medium ${isSelected ? currentTheme.primaryText : currentTheme.textSecondary}`}>
                                      {option.label}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>
                                  {isSelected ? `${option.label} selected` : `Use ${option.label} as the board icon`}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold ${currentTheme.textSecondary}`}>Color</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className={helpIconButtonClassName} aria-label="Board color help">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              The accent color is paired with the icon throughout the board workspace.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-2 py-1">
                          {BOARD_LOGO_COLOR_OPTIONS.map((option) => {
                            const isSelected = option.key === logoColorKey;

                            return (
                              <Tooltip key={option.key}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => setLogoColorKey(option.key)}
                                    aria-pressed={isSelected}
                                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-[border-color,box-shadow,transform] duration-300 ease-out ${isSelected ? `border-transparent ring-2 ${currentTheme.ring} ring-offset-2 ring-offset-white shadow-sm dark:ring-offset-zinc-900` : `${currentTheme.inputBorder} hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10`}`}
                                    style={{ backgroundColor: option.hex }}
                                  >
                                    {isSelected ? <Check className="h-4 w-4 text-white" aria-hidden="true" /> : null}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>
                                  {isSelected ? `${option.label} selected` : `Use ${option.label} accent`}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="column-limits" className={`border-b ${currentTheme.border}`}>
                <AccordionTrigger className={accordionTriggerClassName} indicator={accordionIndicator}>
                  <div className="flex min-w-0 flex-1 items-center gap-4 py-5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Columns3 className={`h-4 w-4 ${currentTheme.primaryText}`} />
                        <h2 className={`text-lg font-semibold ${currentTheme.text}`}>Board Columns</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className={helpIconButtonClassName} aria-label="Column task limits help">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            Set work-in-progress thresholds per workflow column. Leave fields blank to disable them.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className={sectionDescriptionClassName}>
                        Configure workflow capacity for the active board columns.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-6">
                  <div className="mb-4 hidden md:grid md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
                    <div />
                    <div className="space-y-0.5">
                      <h3 className={`text-sm font-semibold ${currentTheme.textSecondary}`}>Soft limit</h3>
                      <p className={`text-xs ${currentTheme.textMuted}`}>Warning threshold. Leave blank to disable.</p>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className={`text-sm font-semibold ${currentTheme.textSecondary}`}>Hard limit</h3>
                      <p className={`text-xs ${currentTheme.textMuted}`}>Blocks more tasks. Up to 20, and cannot be lower than the soft limit.</p>
                    </div>
                  </div>

                  <div className={`overflow-hidden border-y ${currentTheme.border}`}>
                    {normalizedColumnLimitRows.map((row, index) => (
                      <div
                        key={row.statusKey}
                        className={`grid gap-4 px-1 py-4 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)] md:items-start ${index > 0 ? `border-t ${currentTheme.border}` : ""}`}
                      >
                        <div className="flex min-h-[52px] items-center">
                          <BoardStatusBadge statusKey={row.statusKey} />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`board-column-soft-${row.statusKey}`}
                            className={`block text-sm font-semibold md:hidden ${currentTheme.textSecondary}`}
                          >
                            Soft limit
                          </label>
                          <input
                            id={`board-column-soft-${row.statusKey}`}
                            type="text"
                            inputMode="numeric"
                            value={row.softLimit}
                            onChange={(event) =>
                              setColumnLimitInputs((previous) =>
                                previous.map((item) =>
                                  item.statusKey === row.statusKey
                                    ? { ...item, softLimit: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder="None"
                            aria-label={`${EDITABLE_COLUMN_LIMITS.find((item) => item.statusKey === row.statusKey)?.label} soft limit`}
                            className={`w-full px-4 py-3 ${getNativeInputFieldClassName(currentTheme, {
                              surfaceClassName: fieldSurfaceClassName,
                            })} ${row.softLimitError ? "border-red-500" : ""}`}
                          />
                          {row.softLimitError ? <p className="text-sm text-red-500">{row.softLimitError}</p> : null}
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`board-column-hard-${row.statusKey}`}
                            className={`block text-sm font-semibold md:hidden ${currentTheme.textSecondary}`}
                          >
                            Hard limit
                          </label>
                          <input
                            id={`board-column-hard-${row.statusKey}`}
                            type="text"
                            inputMode="numeric"
                            value={row.hardLimit}
                            onChange={(event) =>
                              setColumnLimitInputs((previous) =>
                                previous.map((item) =>
                                  item.statusKey === row.statusKey
                                    ? { ...item, hardLimit: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder="None"
                            aria-label={`${EDITABLE_COLUMN_LIMITS.find((item) => item.statusKey === row.statusKey)?.label} hard limit`}
                            className={`w-full px-4 py-3 ${getNativeInputFieldClassName(currentTheme, {
                              surfaceClassName: fieldSurfaceClassName,
                            })} ${row.hardLimitError ? "border-red-500" : ""}`}
                          />
                          {row.hardLimitError ? <p className="text-sm text-red-500">{row.hardLimitError}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="members" className="border-b-0">
                <AccordionTrigger className={accordionTriggerClassName} indicator={accordionIndicator}>
                  <div className="flex min-w-0 flex-1 items-center gap-4 py-5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className={`h-4 w-4 ${currentTheme.primaryText}`} />
                        <h2 className={`text-lg font-semibold ${currentTheme.text}`}>Manage Team Access</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className={helpIconButtonClassName} aria-label="Manage team access help">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            Add new collaborators here and remove members who no longer need board access.
                          </TooltipContent>
                        </Tooltip>
                        <span className={`text-xs font-medium ${currentTheme.primaryText}`}>
                          ({members.length} member{members.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <p className={sectionDescriptionClassName}>
                        Control who can work inside the board and keep the team roster current.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pt-2 pb-6">
                  <div className="space-y-6">
                    <UserSearchPicker
                      excludedUserIds={memberUserIds}
                      onSelectUser={handleAddMember}
                      disabled={hasReachedMemberLimit}
                      showResultTooltips={false}
                      placeholder={hasReachedMemberLimit ? "Member limit reached" : "Search members"}
                    />

                    <p className={`text-sm ${currentTheme.textMuted}`}>
                      Boards can have up to {MAX_BOARD_MEMBERS} members total. This board is currently using {totalMemberCount} of {MAX_BOARD_MEMBERS}.
                    </p>

                    <div className={`overflow-hidden border-y ${currentTheme.border}`}>
                      {members.map((member, index) => {
                        const isOwner = member.role === "owner";

                        return (
                          <div
                            key={member.userId}
                            className={index > 0 ? `border-t ${currentTheme.border}` : ""}
                          >
                            <BoardMemberListItem
                              currentTheme={currentTheme}
                              displayName={member.name}
                              username={member.username}
                              role={member.role}
                              surfaceClassName=""
                              variant="flat"
                              showRoleIcon={false}
                              action={
                                !isOwner ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <UtilityIconButton
                                          type="button"
                                          size="sm"
                                          aria-label={`Remove ${member.name}`}
                                          onClick={() => handleRemoveMember(member.userId)}
                                        >
                                          <X className="h-4 w-4" />
                                        </UtilityIconButton>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={8}>
                                      Remove {member.name}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : undefined
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex flex-col items-stretch justify-end gap-3 pt-1 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={resetDraft}
                disabled={!isDirty && !showError && !hasTouchedName}
                className={`w-full px-5 font-semibold sm:w-96 ${secondaryActionButtonClassName}`}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || hasColumnLimitErrors}
                className={`w-full px-5 font-semibold sm:w-96 ${primaryActionButtonClassName}`}
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
