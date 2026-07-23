import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useEffect, useRef, useState } from 'react';

const REPEAT_COOLDOWN_MS = 2000;
const RELEVANT_FORMATS = [
  BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
];

// zxing-js calls console.warn('MultiFormatReader: non-ReaderException from reader:', ex) for
// every frame where no code is found — expected during continuous scanning, but it floods
// devtools. Silence just that message (console.warn, not console.error).
function silenceZXingNoise(): () => void {
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('non-ReaderException from reader')) return;
    original(...args);
  };
  return () => { console.warn = original; };
}

export function useBarcodeScanner(enabled: boolean, onDetected: (code: string) => void, initialSuppressedCode?: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onDetectedRef = useRef(onDetected);
  const lastRef = useRef<{ code: string; time: number } | null>(null);
  const [error, setError] = useState('');
  const [flashCode, setFlashCode] = useState('');
  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!enabled) return;
    setError('');
    // If we just arrived here because of a scan elsewhere (e.g. navigating from the sales
    // list's quick-scan panel to a new sale pre-filled with that product), the same barcode is
    // usually still sitting in front of the camera. Seed the cooldown with it so this panel's
    // own first frame doesn't immediately double-count the item that brought us here.
    lastRef.current = initialSuppressedCode ? { code: initialSuppressedCode, time: Date.now() } : null;
    let cancelled = false;
    let restoreConsole: (() => void) | null = null;

    // React StrictMode double-invokes this effect on mount (mount -> cleanup -> mount) to
    // surface non-idempotent effects. ZXing's stream/video attachment isn't safe against being
    // started twice back-to-back on the same <video>, which left the panel with a dead black
    // frame after the synthetic first pass tore down what the second pass had just attached.
    // Deferring the actual camera acquisition means the synthetic pass's cleanup (which runs
    // synchronously, before any timer fires) cancels itself before ever touching the camera —
    // only the real, final mount goes on to acquire it.
    const timer = window.setTimeout(() => {
      restoreConsole = silenceZXingNoise();
      const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, RELEVANT_FORMATS]]);
      const reader = new BrowserMultiFormatReader(hints);
      reader
        .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
          if (cancelled || !result) return;
          const code = result.getText();
          const now = Date.now();
          if (lastRef.current && lastRef.current.code === code && now - lastRef.current.time < REPEAT_COOLDOWN_MS) return;
          lastRef.current = { code, time: now };
          onDetectedRef.current(code);
          setFlashCode(code);
          window.setTimeout(() => setFlashCode(''), 900);
        })
        .then((controls) => {
          controlsRef.current = controls;
          if (cancelled) controls.stop();
        })
        .catch(() => {
          if (!cancelled) setError('Kameraga ruxsat berilmadi yoki kamera topilmadi.');
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controlsRef.current?.stop();
      controlsRef.current = null;
      restoreConsole?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { videoRef, error, flashCode };
}
