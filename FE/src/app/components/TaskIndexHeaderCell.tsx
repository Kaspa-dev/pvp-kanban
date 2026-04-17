import { TableHead } from "./ui/table";
import { cn } from "./ui/utils";

type SortDirection = "asc" | "desc" | null;

interface TaskIndexHeaderCellProps {
  label: string;
  align?: "left" | "center" | "right";
  sortDirection?: SortDirection;
  onSort?: () => void;
  widthClassName?: string;
  dividerClassName?: string;
  textClassName: string;
  activeTextClassName: string;
  buttonHoverClassName: string;
  className?: string;
}

const justifyClassMap = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
} as const;

function SortDirectionGlyph({ direction }: { direction: "asc" | "desc" }) {
  const isAscending = direction === "asc";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn(
        "h-[0.8rem] w-[0.8rem] shrink-0 opacity-70",
        isAscending ? "translate-y-[-0.02rem]" : "translate-y-[0.02rem]",
      )}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isAscending ? (
        <path
          d="M6 2.2L8.95 5.4M6 2.2L3.05 5.4M6 2.2V9.6"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 9.8L8.95 6.6M6 9.8L3.05 6.6M6 9.8V2.4"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function TaskIndexHeaderCell({
  label,
  align = "left",
  sortDirection = null,
  onSort,
  widthClassName,
  dividerClassName,
  textClassName,
  activeTextClassName,
  buttonHoverClassName,
  className,
}: TaskIndexHeaderCellProps) {
  const isSortable = Boolean(onSort);
  const shouldShowSortGlyph = sortDirection === "asc" || sortDirection === "desc";

  const content = (
    <>
      <span className="truncate">{label}</span>
      {shouldShowSortGlyph && <SortDirectionGlyph direction={sortDirection} />}
    </>
  );

  return (
    <TableHead
      className={cn(
        "h-12 px-5 align-middle",
        widthClassName,
        dividerClassName,
        justifyClassMap[align],
        className,
      )}
    >
      {isSortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "font-ui-condensed inline-flex w-full items-center gap-2 text-[0.95rem] font-semibold leading-none tracking-[0.015em] transition-colors focus-visible:outline-none focus-visible:ring-0",
            justifyClassMap[align],
            textClassName,
            buttonHoverClassName,
          )}
          aria-label={`Sort by ${label}`}
        >
          {content}
        </button>
      ) : (
        <span
          className={cn(
            "font-ui-condensed inline-flex w-full items-center gap-2 text-[0.95rem] font-semibold leading-none tracking-[0.015em]",
            justifyClassMap[align],
            textClassName,
          )}
        >
          {content}
        </span>
      )}
    </TableHead>
  );
}
