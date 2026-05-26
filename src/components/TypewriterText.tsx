import { useEffect, useMemo, useRef, useState } from "react";

type TypewriterTextProps = {
  text: string;
  speed: number;
  revealAllSignal: number;
  onComplete: () => void;
};

export default function TypewriterText({
  text,
  speed,
  revealAllSignal,
  onComplete
}: TypewriterTextProps) {
  const [visibleCount, setVisibleCount] = useState(text.length > 0 ? 1 : 0);
  const previousRevealSignal = useRef(revealAllSignal);

  useEffect(() => {
    setVisibleCount(text.length > 0 ? 1 : 0);
  }, [text]);

  useEffect(() => {
    if (previousRevealSignal.current !== revealAllSignal) {
      previousRevealSignal.current = revealAllSignal;
      setVisibleCount(text.length);
    }
  }, [revealAllSignal, text.length]);

  useEffect(() => {
    if (visibleCount >= text.length) {
      onComplete();
      return;
    }
    const delay = Math.max(12, Math.round(1000 / Math.max(1, speed)));
    const timer = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + 1, text.length));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [onComplete, speed, text.length, visibleCount]);

  const renderedText = useMemo(() => text.slice(0, visibleCount), [text, visibleCount]);

  return <p className="dialogue-text">{renderedText}</p>;
}
