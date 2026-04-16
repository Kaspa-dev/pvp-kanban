import { ComponentPropsWithoutRef, ElementType } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type OverflowTooltipProps<T extends ElementType = "span"> = {
  as?: T;
  text: string;
  className?: string;
  tooltipClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function OverflowTooltip<T extends ElementType = "span">({
  as,
  text,
  className,
  tooltipClassName,
  side = "top",
  sideOffset = 8,
  ...rest
}: OverflowTooltipProps<T>) {
  const Component = (as ?? "span") as ElementType;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Component className={className} {...rest}>
          {text}
        </Component>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className={tooltipClassName ?? "max-w-none whitespace-nowrap"}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
