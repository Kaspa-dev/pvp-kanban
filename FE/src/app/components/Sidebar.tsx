import * as Popover from "@radix-ui/react-popover";
import { Calendar, ChevronDown, Inbox, LogOut, Plus, Tag, User, X } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { BoardLogo } from "./BoardLogo";
import { Label } from "../utils/labels";
import { BanBanLogo } from "./BanBanLogo";
import { BoardLogoColorKey, BoardLogoIconKey } from "../utils/boardIdentity";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Sidebar as WorkspaceSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import { CustomScrollArea } from "./CustomScrollArea";

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateTask: () => void;
  selectedLabels: number[];
  onLabelsChange: (labels: number[]) => void;
  onLogout?: () => void;
  boardName?: string;
  boardLogoIconKey?: BoardLogoIconKey;
  boardLogoColorKey?: BoardLogoColorKey;
  labels: Label[];
  className?: string;
}

export function Sidebar({
  activeFilter,
  onFilterChange,
  onCreateTask,
  selectedLabels,
  onLabelsChange,
  onLogout,
  boardName,
  boardLogoIconKey,
  boardLogoColorKey,
  labels,
  className = "",
}: SidebarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filters = [
    { id: "all", label: "All tasks", icon: Inbox, hint: "Show every task in this board" },
    { id: "assigned", label: "Assigned to me", icon: User, hint: "Focus only on tasks assigned to you" },
    { id: "due", label: "Due this week", icon: Calendar, hint: "Show tasks due in the current week" },
  ];

  const toggleLabel = (labelId: number) => {
    if (selectedLabels.includes(labelId)) {
      onLabelsChange(selectedLabels.filter((value) => value !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  const removeLabel = (labelId: number) => {
    onLabelsChange(selectedLabels.filter((value) => value !== labelId));
  };

  const primaryActionButtonClassName = `group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const panelCardClassName = `relative overflow-hidden rounded-[24px] border ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03]" : "bg-white/85"} backdrop-blur-xl`;

  return (
    <WorkspaceSidebar collapsible="icon" className={className}>
      <div
        className={`relative flex h-full w-full flex-col overflow-hidden ${workspaceSurface.panelSurfaceClassName}`}
        style={workspaceSurface.panelSurfaceStyle}
      >
        <div className={`pointer-events-none absolute -left-14 top-10 h-36 w-36 rounded-full bg-gradient-to-br ${currentTheme.primarySoftStrong} blur-3xl`} />
        <div className={`pointer-events-none absolute -right-12 bottom-16 h-36 w-36 rounded-full bg-gradient-to-tr ${currentTheme.primarySoft} blur-3xl`} />

        <SidebarHeader className="relative z-10 gap-0 p-0">
          <div className={`border-b px-4 py-4 ${currentTheme.border}`}>
            <div className={`rounded-[24px] border px-4 py-4 ${currentTheme.border} ${isDarkMode ? "bg-black/20" : "bg-white/80"} backdrop-blur-xl`}>
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.primary} shadow-lg`}>
                  {isCollapsed ? (
                    <BoardLogo iconKey={boardLogoIconKey} colorKey={boardLogoColorKey} size="xs" />
                  ) : (
                    <BanBanLogo size="sm" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${currentTheme.textMuted}`}>
                      Board Workspace
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <BoardLogo iconKey={boardLogoIconKey} colorKey={boardLogoColorKey} size="xs" />
                      <h2 className={`truncate text-base font-bold ${currentTheme.text}`}>
                        {boardName ?? "Untitled Board"}
                      </h2>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="relative z-10 gap-4 overflow-hidden px-3 py-4">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      closeMobileSidebar();
                      onCreateTask();
                    }}
                    className={`${primaryActionButtonClassName} ${isCollapsed ? "h-12 w-12 rounded-2xl" : "w-full gap-2 px-4 py-3.5 text-sm"}`}
                    type="button"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Plus className={`transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110 ${isCollapsed ? "h-5 w-5" : "h-4.5 w-4.5"}`} />
                      {!isCollapsed && <span>Create Task</span>}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>Create a new task in staging</TooltipContent>
              </Tooltip>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className={currentTheme.border} />

          <SidebarGroup className="p-0">
            {!isCollapsed && (
              <SidebarGroupLabel className={`px-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
                Quick Filters
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;

                  return (
                    <SidebarMenuItem key={filter.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={isActive}
                        tooltip={filter.hint}
                        onClick={() => {
                          closeMobileSidebar();
                          onFilterChange(filter.id);
                        }}
                        className={`h-11 rounded-2xl border px-3 transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg border-transparent`
                            : `${currentTheme.textSecondary} ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white/75 hover:bg-white"}`
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span>{filter.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="min-h-0 flex-1 p-0">
            {!isCollapsed && (
              <SidebarGroupLabel className={`px-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
                Labels
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent className="min-h-0">
              <Popover.Root>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex w-full ${isCollapsed ? "justify-center" : ""}`}>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          className={`flex h-11 items-center rounded-2xl border px-3 text-left transition-all ${currentTheme.border} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white/75 hover:bg-white"} ${isCollapsed ? "w-11 justify-center px-0" : "w-full justify-between"}`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Tag className={`h-4.5 w-4.5 shrink-0 ${selectedLabels.length > 0 ? currentTheme.primaryText : currentTheme.textMuted}`} />
                            {!isCollapsed && (
                              <span className={`truncate text-sm font-medium ${currentTheme.textSecondary}`}>
                                {selectedLabels.length > 0 ? `${selectedLabels.length} label filters` : "Browse labels"}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && <ChevronDown className={`h-4 w-4 shrink-0 ${currentTheme.textMuted}`} />}
                        </button>
                      </Popover.Trigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>Filter tasks by label</TooltipContent>
                </Tooltip>

                <Popover.Portal>
                  <Popover.Content
                    className={`z-50 w-64 overflow-hidden rounded-2xl border p-3 shadow-2xl ${currentTheme.cardBg} ${currentTheme.border}`}
                    sideOffset={10}
                    align={isCollapsed ? "center" : "start"}
                  >
                    <div className="mb-3 px-1">
                      <h4 className={`text-xs font-bold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                        Filter by labels
                      </h4>
                    </div>

                    <div className={`${panelCardClassName} p-1`}>
                      {labels.length === 0 ? (
                        <div className={`px-4 py-4 text-sm ${currentTheme.textMuted}`}>
                          No labels yet. Create one in the task form first.
                        </div>
                      ) : (
                        <CustomScrollArea viewportClassName="max-h-64 py-1 pr-1">
                          <div className="space-y-1">
                            {labels.map((label) => {
                              const isSelected = selectedLabels.includes(label.id);
                              return (
                                <button
                                  key={label.id}
                                  type="button"
                                  onClick={() => toggleLabel(label.id)}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                    isSelected
                                      ? `${currentTheme.primaryBg} ${currentTheme.primaryText}`
                                      : `${currentTheme.text} ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-50"}`
                                  }`}
                                >
                                  <div
                                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                  />
                                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                    {label.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </CustomScrollArea>
                      )}
                    </div>

                    <Popover.Arrow className="fill-current" style={{ color: isDarkMode ? "#18181b" : "#ffffff" }} />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              {!isCollapsed && selectedLabels.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className={`px-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.textMuted}`}>
                    Active Labels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLabels.map((labelId) => {
                      const label = labels.find((item) => item.id === labelId);
                      if (!label) {
                        return null;
                      }

                      return (
                        <button
                          key={labelId}
                          type="button"
                          onClick={() => removeLabel(labelId)}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
                          style={{ backgroundColor: label.color }}
                        >
                          <span className="max-w-[10rem] truncate">{label.name}</span>
                          <X className="h-3 w-3" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {onLogout && (
          <>
            <SidebarSeparator className={currentTheme.border} />
            <SidebarFooter className="relative z-10 p-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="button"
                    tooltip="Sign out of your account"
                    onClick={() => {
                      closeMobileSidebar();
                      onLogout();
                    }}
                    className={`h-11 rounded-2xl border px-3 ${currentTheme.border} ${currentTheme.textSecondary} ${isDarkMode ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-white/75 hover:bg-white"}`}
                  >
                    <LogOut className="h-4.5 w-4.5 shrink-0" />
                    <span>Log out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </>
        )}
      </div>
      <SidebarRail />
    </WorkspaceSidebar>
  );
}
