import { forwardRef, ReactNode } from "react";
import { Label } from "../utils/labels";
import { OverflowTooltip } from "./OverflowTooltip";
import { cn } from "./ui/utils";

interface LabelBadgeProps {
  label: Pick<Label, "name" | "color">;
  className?: string;
  tooltip?: boolean;
  tooltipClassName?: string;
  children?: ReactNode;
}

export const LabelBadge = forwardRef<HTMLSpanElement, LabelBadgeProps>(function LabelBadge({
  label,
  className,
  tooltip = false,
  tooltipClassName,
  children,
}, ref) {
  const badgeClassName = cn(
    "inline-flex min-w-0 items-center rounded-full text-white dark:text-gray-900",
    className,
  );

  if (tooltip) {
    return (
      <OverflowTooltip
        text={label.name}
        className={badgeClassName}
        style={{ backgroundColor: label.color }}
        tooltipClassName={tooltipClassName}
      />
    );
  }

  return (
    <span ref={ref} className={badgeClassName} style={{ backgroundColor: label.color }}>
      {children ?? <span className="truncate">{label.name}</span>}
    </span>
  );
});
