import { ComponentPropsWithoutRef, ElementType } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type OverflowTooltipProps<T extends ElementType = "span"> = {
  as?: T;
  text: string;
  className?: string;
  tooltipClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  delayDuration?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function OverflowTooltip<T extends ElementType = "span">({
  as,
  text,
  className,
  tooltipClassName,
  side = "top",
  align = "center",
  sideOffset = 8,
  delayDuration,
  ...rest
}: OverflowTooltipProps<T>) {
  const Component = (as ?? "span") as ElementType;

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        <Component className={className} {...rest}>
          {text}
        </Component>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={tooltipClassName ?? "max-w-none whitespace-nowrap"}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
