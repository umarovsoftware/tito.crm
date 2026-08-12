import { useEffect, useRef } from 'react';

const MAX_INTERVAL_MS = 50;
const MIN_CODE_LENGTH = 4;

function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (element as HTMLElement).isContentEditable;
}

// USB/Bluetooth barcode scanners act as keyboards: they "type" a code and send Enter, with each
// character arriving far faster than a human could type. This listens globally and only reacts
// when no field has focus, so it never steals keystrokes from forms — the moment an input or
// select is focused, characters flow into it normally instead of being captured here.
export function useHidScanner(enabled: boolean, onDetected: (code: string) => void) {
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(document.activeElement)) return;
      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (event.key === 'Enter') {
        const code = bufferRef.current;
        bufferRef.current = '';
        if (code.length >= MIN_CODE_LENGTH) {
          event.preventDefault();
          onDetectedRef.current(code);
        }
        return;
      }
      if (event.key.length !== 1) return; // ignore Shift, Tab, arrows, etc.
      bufferRef.current = gap <= MAX_INTERVAL_MS ? bufferRef.current + event.key : event.key;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
