import { Check, Fingerprint, HelpCircle, Users, X } from "lucide-react";
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
import { Board } from "../utils/boards";
import { ProjectUser } from "../utils/users";
import { BoardLogo } from "./BoardLogo";
import { BoardMemberListItem } from "./BoardMemberListItem";
import { UserSearchPicker } from "./UserSearchPicker";
import { UtilityIconButton } from "./UtilityIconButton";
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
const BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS = "min-h-24 max-h-48";
const fieldSurfaceClassName = "bg-input-background dark:bg-input/30";

interface BoardSettingsDraft {
  name: string;
  description: string;
  logoIconKey: BoardLogoIconKey;
  logoColorKey: BoardLogoColorKey;
  memberUserIds: number[];
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
  const [memberDirectory, setMemberDirectory] = useState<Record<number, ProjectUser>>(initialDirectory);
  const [showError, setShowError] = useState(false);
  const [hasTouchedName, setHasTouchedName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(initialDraft.name);
    setDescription(initialDraft.description);
    setLogoIconKey(initialDraft.logoIconKey);
    setLogoColorKey(initialDraft.logoColorKey);
    setMemberUserIds(initialDraft.memberUserIds);
    setMemberDirectory(initialDirectory);
    setShowError(false);
    setHasTouchedName(false);
    setIsSubmitting(false);
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
  const isDirty =
    name.trim() !== initialDraft.name ||
    description.trim() !== initialDraft.description ||
    logoIconKey !== initialDraft.logoIconKey ||
    logoColorKey !== initialDraft.logoColorKey ||
    !haveSameMemberIds(memberUserIds, initialDraft.memberUserIds);

  const nameInputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: fieldSurfaceClassName,
  });
  const iconOptionSurfaceClassName = fieldSurfaceClassName;
  const sectionDividerClassName = isDarkMode ? "bg-zinc-800" : "bg-gray-200";
  const sectionDescriptionClassName = `text-sm ${currentTheme.textMuted}`;
  const helpIconButtonClassName = `inline-flex h-5 w-5 items-center justify-center rounded-full ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;
  const accordionTriggerClassName = `group rounded-none py-0 hover:no-underline`;

  const focusNameField = () => {
    window.requestAnimationFrame(() => {
      nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInputRef.current?.focus();
    });
  };

  const resetDraft = () => {
    setName(initialDraft.name);
    setDescription(initialDraft.description);
    setLogoIconKey(initialDraft.logoIconKey);
    setLogoColorKey(initialDraft.logoColorKey);
    setMemberUserIds(initialDraft.memberUserIds);
    setMemberDirectory(initialDirectory);
    setShowError(false);
    setHasTouchedName(false);
    setIsSubmitting(false);
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
              <p className={sectionDescriptionClassName}>
                Update the board identity and member access without leaving the workspace.
              </p>
            </header>

            <Accordion
              type="multiple"
              defaultValue={["general", "members"]}
              className={`border-y ${currentTheme.border}`}
            >
              <AccordionItem value="general" className={`border-b ${currentTheme.border}`}>
                <AccordionTrigger className={accordionTriggerClassName}>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-4 py-5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Fingerprint className={`h-4 w-4 ${currentTheme.primaryText}`} />
                        <h2 className={`text-lg font-semibold ${currentTheme.text}`}>General</h2>
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
                    <BoardLogo iconKey={logoIconKey} colorKey={logoColorKey} size="md" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="space-y-6">
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
                            <p className={`text-xs ${currentTheme.textMuted}`}>Shown in the sidebar and workspace headers.</p>
                          )}
                          <span className={`text-xs ${currentTheme.textMuted}`}>
                            {name.trim().length}/{MAX_BOARD_NAME_LENGTH}
                          </span>
                        </div>
                      </div>

                      <div>
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
                          className={`w-full resize-y px-4 py-3 ${BOARD_DESCRIPTION_TEXTAREA_HEIGHT_CLASS} ${getNativeInputFieldClassName(currentTheme, {
                            surfaceClassName: fieldSurfaceClassName,
                          })}`}
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className={`text-xs ${currentTheme.textMuted}`}>Visible to everyone who can access the board.</p>
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
                        <p className={`text-xs ${currentTheme.textMuted}`}>Used in the sidebar and board previews.</p>
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
                        <p className={`text-xs ${currentTheme.textMuted}`}>Pick a color that stays readable in both themes.</p>
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

              <AccordionItem value="members" className="border-b-0">
                <AccordionTrigger className={accordionTriggerClassName}>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-4 py-5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className={`h-4 w-4 ${currentTheme.primaryText}`} />
                        <h2 className={`text-lg font-semibold ${currentTheme.text}`}>Members</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className={helpIconButtonClassName} aria-label="Board members help">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            Add new collaborators here and remove members who no longer need board access.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className={sectionDescriptionClassName}>
                        Control who can work inside the board and keep the team roster current.
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm ${currentTheme.textMuted}`}>
                      {totalMemberCount}/{MAX_BOARD_MEMBERS}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${currentTheme.textSecondary}`}>Add member</h3>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className={helpIconButtonClassName} aria-label="Add board member help">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            Search by display name, username, or email to invite someone into the board.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className={`text-xs ${currentTheme.textMuted}`}>
                        Owners stay protected. Team members can be removed before saving.
                      </p>
                    </div>

                    <UserSearchPicker
                      excludedUserIds={memberUserIds}
                      onSelectUser={handleAddMember}
                      disabled={hasReachedMemberLimit}
                      showResultTooltips={false}
                      placeholder={hasReachedMemberLimit ? "Member limit reached" : "Search members"}
                    />

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
          </div>
        </div>

        <div className={`shrink-0 border-t ${currentTheme.border} ${isDarkMode ? "bg-zinc-950/45" : "bg-white/72"} backdrop-blur-xl`}>
          <div className="mx-auto flex w-full max-w-[1180px] items-center justify-end gap-3 px-8 py-4 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={resetDraft}
              disabled={!isDirty && !showError && !hasTouchedName}
              className={`px-5 ${secondaryActionButtonClassName}`}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className={`px-5 ${primaryActionButtonClassName}`}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
