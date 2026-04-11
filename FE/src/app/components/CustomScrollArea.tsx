import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface CustomScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}

const THUMB_MIN_HEIGHT = 36;

export function CustomScrollArea({
  children,
  className = "",
  viewportClassName = "",
}: CustomScrollAreaProps) {
  const { isDarkMode } = useTheme();
  const scrollbarPalette = useMemo(
    () => ({
      track: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.78)",
      thumb: isDarkMode ? "rgba(113, 113, 122, 0.88)" : "rgba(148, 163, 184, 0.88)",
      thumbActive: isDarkMode ? "rgba(161, 161, 170, 0.96)" : "rgba(100, 116, 139, 0.92)",
    }),
    [isDarkMode],
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ startY: 0, startScrollTop: 0 });
  const reservedScrollbarGutterClassName = "pr-3";

  const thumbStyle = useMemo(
    () => ({
      backgroundColor: isDragging ? scrollbarPalette.thumbActive : scrollbarPalette.thumb,
    }),
    [isDragging, scrollbarPalette],
  );

  const updateThumb = () => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = viewport;
    const nextScrollable = scrollHeight > clientHeight + 1;

    setIsScrollable(nextScrollable);

    if (!nextScrollable) {
      setThumbHeight(0);
      setThumbOffset(0);
      return;
    }

    const nextThumbHeight = Math.max(
      THUMB_MIN_HEIGHT,
      (clientHeight / scrollHeight) * clientHeight,
    );
    const maxThumbOffset = clientHeight - nextThumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    const nextThumbOffset =
      maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbOffset : 0;

    setThumbHeight(nextThumbHeight);
    setThumbOffset(nextThumbOffset);
  };

  useEffect(() => {
    updateThumb();
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleScroll = () => {
      updateThumb();
    };

    viewport.addEventListener("scroll", handleScroll);

    const resizeObserver = new ResizeObserver(() => {
      updateThumb();
    });

    resizeObserver.observe(viewport);
    if (viewport.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(viewport.firstElementChild);
    }

    window.addEventListener("resize", updateThumb);

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateThumb);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const { clientHeight, scrollHeight } = viewport;
      const maxScrollTop = scrollHeight - clientHeight;
      const maxThumbOffset = clientHeight - thumbHeight;

      if (maxScrollTop <= 0 || maxThumbOffset <= 0) {
        return;
      }

      const deltaY = event.clientY - dragStateRef.current.startY;
      const scrollDelta = (deltaY / maxThumbOffset) * maxScrollTop;
      viewport.scrollTop = dragStateRef.current.startScrollTop + scrollDelta;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, thumbHeight]);

  const handleThumbMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      startY: event.clientY,
      startScrollTop: viewport.scrollTop,
    };

    setIsDragging(true);
  };

  const handleTrackMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !isScrollable) {
      return;
    }

    const trackRect = event.currentTarget.getBoundingClientRect();
    const clickOffset = event.clientY - trackRect.top;
    const thumbCenter = thumbHeight / 2;
    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    const maxThumbOffset = viewport.clientHeight - thumbHeight;

    if (maxScrollTop <= 0 || maxThumbOffset <= 0) {
      return;
    }

    const nextThumbOffset = Math.min(
      Math.max(clickOffset - thumbCenter, 0),
      maxThumbOffset,
    );

    viewport.scrollTop = (nextThumbOffset / maxThumbOffset) * maxScrollTop;
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={viewportRef}
        className={`hide-native-scrollbar overflow-y-auto ${reservedScrollbarGutterClassName} ${viewportClassName}`}
        style={{ scrollbarGutter: "stable" }}
      >
        {children}
      </div>

      {isScrollable && (
        <div
          className="absolute bottom-2 right-1 top-2 w-2 rounded-full"
          style={{ backgroundColor: scrollbarPalette.track }}
          onMouseDown={handleTrackMouseDown}
        >
          <div
            className="absolute left-0 right-0 rounded-full transition-colors"
            style={{
              ...thumbStyle,
              height: `${thumbHeight}px`,
              transform: `translateY(${thumbOffset}px)`,
            }}
            onMouseDown={handleThumbMouseDown}
          />
        </div>
      )}
    </div>
  );
}
