import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

type PaginationItemValue = number | "ellipsis";

function buildPaginationItems(totalPages: number, currentPage: number): PaginationItemValue[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalizedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items: PaginationItemValue[] = [];
  normalizedPages.forEach((page, index) => {
    if (index > 0 && page - normalizedPages[index - 1] > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

interface WorkspacePaginationFooterProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  createPageHref?: (page: number) => string;
  disabled?: boolean;
  className: string;
  keycapClassName: string;
  mutedTextClassName: string;
  pageActiveClassName: string;
  pageInactiveClassName: string;
  previousNextInactiveClassName: string;
  previousNextDisabledClassName: string;
  ellipsisClassName?: string;
  summaryText?: string;
  summaryTextClassName?: string;
}

export function WorkspacePaginationFooter({
  currentPage,
  totalPages,
  onPageChange,
  createPageHref,
  disabled = false,
  className,
  keycapClassName,
  mutedTextClassName,
  pageActiveClassName,
  pageInactiveClassName,
  previousNextInactiveClassName,
  previousNextDisabledClassName,
  ellipsisClassName,
  summaryText,
  summaryTextClassName,
}: WorkspacePaginationFooterProps) {
  const effectiveTotalPages = Math.max(totalPages, 1);
  const paginationItems = buildPaginationItems(effectiveTotalPages, currentPage);
  const previousDisabled = disabled || currentPage <= 1;
  const nextDisabled = disabled || currentPage >= effectiveTotalPages;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <kbd className={keycapClassName}>Shift</kbd>
        <span className={mutedTextClassName}>Previous page</span>
        <kbd className={`${keycapClassName} ml-2`}>Tab</kbd>
        <span className={mutedTextClassName}>Next page</span>
      </div>
      <div className="justify-self-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={createPageHref ? createPageHref(Math.max(currentPage - 1, 1)) : "#"}
                aria-disabled={previousDisabled}
                className={previousDisabled ? previousNextDisabledClassName : previousNextInactiveClassName}
                onClick={(event) => {
                  event.preventDefault();
                  if (!previousDisabled) {
                    onPageChange(Math.max(currentPage - 1, 1));
                  }
                }}
              />
            </PaginationItem>

            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis className={ellipsisClassName} />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={createPageHref ? createPageHref(item) : "#"}
                    isActive={item === currentPage}
                    aria-disabled={disabled}
                    className={item === currentPage ? pageActiveClassName : pageInactiveClassName}
                    onClick={(event) => {
                      event.preventDefault();
                      if (!disabled && item !== currentPage) {
                        onPageChange(item);
                      }
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={createPageHref ? createPageHref(Math.min(currentPage + 1, effectiveTotalPages)) : "#"}
                aria-disabled={nextDisabled}
                className={nextDisabled ? previousNextDisabledClassName : previousNextInactiveClassName}
                onClick={(event) => {
                  event.preventDefault();
                  if (!nextDisabled) {
                    onPageChange(Math.min(currentPage + 1, effectiveTotalPages));
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <div className="justify-self-end">
        {summaryText ? <p className={summaryTextClassName}>{summaryText}</p> : null}
      </div>
    </div>
  );
}
