import { Plus, Tag } from "lucide-react";
import { useTheme, getThemeColors } from "../contexts/ThemeContext";
import { BoardLogo } from "./BoardLogo";
import { OverflowTooltip } from "./OverflowTooltip";
import { BoardLogoColorKey, BoardLogoIconKey } from "../utils/boardIdentity";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getWorkspaceSurfaceStyles } from "../utils/workspaceSurfaceStyles";
import { MAX_BOARD_LABELS } from "../utils/labels";
import { getIconActionButtonClassName } from "./iconActionButtonStyles";
import {
  Sidebar as WorkspaceSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";

interface SidebarProps {
  onCreateTask: () => void;
  onOpenLabels: () => void;
  labelCount?: number;
  boardName?: string;
  boardLogoIconKey?: BoardLogoIconKey;
  boardLogoColorKey?: BoardLogoColorKey;
  className?: string;
}

export function Sidebar({
  onCreateTask,
  onOpenLabels,
  labelCount = 0,
  boardName,
  boardLogoIconKey,
  boardLogoColorKey,
  className = "",
}: SidebarProps) {
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const sidebarToggleButtonClassName = `${getIconActionButtonClassName(currentTheme, {
    size: "sm",
    emphasis: "elevated",
  })} rounded-xl`;

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const primaryActionButtonClassName = `group/create-task relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;
  const labelsActionButtonClassName = `group/board-labels relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus} ${currentTheme.primary}`;

  return (
    <WorkspaceSidebar
      collapsible="icon"
      className={`!border-r-0 [&_[data-slot=sidebar-container]]:border-r-0 [&_[data-slot=sidebar-inner]]:bg-transparent ${className}`.trim()}
      style={{ ["--sidebar-width-icon" as string]: "4.25rem" }}
    >
      <div
        className={`relative flex h-full w-full flex-col overflow-hidden border-t border-r ${currentTheme.border} backdrop-blur-xl`}
        style={{
          ...workspaceSurface.glassHeaderStyle,
          ...workspaceSurface.glassSidebarStyle,
        }}
      >
        <div
          data-coachmark="board-sidebar-actions"
          aria-hidden="true"
          className="pointer-events-none absolute inset-[6px]"
        />
        <div className="relative z-10 flex w-full flex-col">
          <SidebarHeader className={`min-h-[7.25rem] gap-0 border-b ${isCollapsed ? "px-2 py-2.5" : "px-2.5 py-2.5"} ${currentTheme.border}`}>
            <div className={`flex flex-col ${isCollapsed ? "items-center gap-1.5" : "items-start gap-2.5"}`}>
              <div className="shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger
                      className={`${sidebarToggleButtonClassName}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {isCollapsed ? (
                <BoardLogo iconKey={boardLogoIconKey} colorKey={boardLogoColorKey} size="md" />
              ) : (
                <div className="flex w-full min-w-0 items-center gap-2.5">
                  <BoardLogo iconKey={boardLogoIconKey} colorKey={boardLogoColorKey} size="md" />
                  <OverflowTooltip
                    as="h2"
                    text={boardName ?? "Untitled Board"}
                    className={`min-w-0 flex-1 truncate text-sm font-semibold ${currentTheme.text}`}
                  />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className={`gap-0 overflow-hidden ${isCollapsed ? "px-1.5 py-2.5" : "px-2.5 py-3"}`}>
            <SidebarGroup
              className={`p-0 ${isCollapsed ? "items-center" : ""}`}
            >
              <SidebarGroupContent className={`w-full ${isCollapsed ? "flex flex-col items-center gap-2" : "space-y-2"}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        closeMobileSidebar();
                        onCreateTask();
                      }}
                      className={`${primaryActionButtonClassName} ${isCollapsed ? "h-10 w-10 self-center px-0" : "h-10 w-full gap-2 px-3 text-sm leading-none"}`}
                      type="button"
                    >
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover/create-task:opacity-100" />
                      <span className="relative z-10 inline-flex items-center gap-2 leading-none">
                        <Plus className="h-4.5 w-4.5 will-change-transform transition-transform duration-200 group-hover/create-task:rotate-90 group-hover/create-task:scale-110" />
                        {!isCollapsed && <span className="leading-none">Create Task</span>}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>Create a new task in staging</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        closeMobileSidebar();
                        onOpenLabels();
                      }}
                      className={`${labelsActionButtonClassName} ${isCollapsed ? "h-10 w-10 self-center px-0" : "h-10 w-full gap-2 px-3 text-sm leading-none"}`}
                      type="button"
                    >
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.24)_50%,transparent_85%)] opacity-0 transition-opacity duration-300 group-hover/board-labels:opacity-100" />
                      <span className={`relative z-10 inline-flex min-w-0 items-center gap-2 ${isCollapsed ? "" : "w-full justify-between"}`}>
                        <span className="inline-flex min-w-0 items-center gap-2 leading-none">
                          <Tag className="h-4.5 w-4.5 shrink-0 will-change-transform transition-transform duration-200 group-hover/board-labels:rotate-6 group-hover/board-labels:scale-110" />
                          {!isCollapsed && <span className="truncate leading-none">Labels</span>}
                        </span>
                        {!isCollapsed && (
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/82">
                            {labelCount}/{MAX_BOARD_LABELS}
                          </span>
                        )}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    Create and review board labels
                  </TooltipContent>
                </Tooltip>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </div>
      </div>
    </WorkspaceSidebar>
  );
}
