import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface CustomScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  onViewportRef?: (node: HTMLDivElement | null) => void;
}

const THUMB_MIN_HEIGHT = 36;
const TRACK_VERTICAL_INSET_PX = 8;

export function CustomScrollArea({
  children,
  className = "",
  viewportClassName = "",
  onViewportRef,
}: CustomScrollAreaProps) {
  const { isDarkMode } = useTheme();
  const scrollbarPalette = useMemo(
    () => ({
      track: isDarkMode ? "rgba(255, 255, 255, 0.055)" : "rgba(0, 0, 0, 0.045)",
      thumb: isDarkMode ? "rgba(161, 161, 170, 0.62)" : "rgba(63, 63, 70, 0.34)",
      thumbActive: isDarkMode ? "rgba(212, 212, 216, 0.72)" : "rgba(39, 39, 42, 0.52)",
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

    const trackHeight = Math.max(clientHeight - TRACK_VERTICAL_INSET_PX * 2, 0);
    const nextThumbHeight = Math.min(
      trackHeight,
      Math.max(
        THUMB_MIN_HEIGHT,
        (clientHeight / scrollHeight) * trackHeight,
      ),
    );
    const maxThumbOffset = trackHeight - nextThumbHeight;
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
      const trackHeight = Math.max(clientHeight - TRACK_VERTICAL_INSET_PX * 2, 0);
      const maxScrollTop = scrollHeight - clientHeight;
      const maxThumbOffset = trackHeight - thumbHeight;

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
    const maxThumbOffset = trackRect.height - thumbHeight;

    if (maxScrollTop <= 0 || maxThumbOffset <= 0) {
      return;
    }

    const nextThumbOffset = Math.min(
      Math.max(clickOffset - thumbCenter, 0),
      maxThumbOffset,
    );

    viewport.scrollTop = (nextThumbOffset / maxThumbOffset) * maxScrollTop;
  };

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    onViewportRef?.(node);
  }, [onViewportRef]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={setViewportRef}
        className={`hide-native-scrollbar overflow-y-auto ${reservedScrollbarGutterClassName} ${viewportClassName}`}
        style={{ scrollbarGutter: "stable" }}
      >
        {children}
      </div>

      {isScrollable && (
        <div
          className="absolute bottom-2 right-1 top-2 w-1 rounded-full"
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
