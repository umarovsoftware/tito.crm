import { CameraOff, CheckCircle2, ScanLine } from 'lucide-react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

export function BarcodeScannerPanel({ onDetected, enabled = true, title = 'Skaner', description = 'Kamera doimiy ochiq — mahsulotni kamera oldiga tuting', aspectClassName = 'aspect-square', fillHeight = false, initialSuppressedCode }: { onDetected: (code: string) => void; enabled?: boolean; title?: string; description?: string; aspectClassName?: string; fillHeight?: boolean; initialSuppressedCode?: string }) {
  const { videoRef, error, flashCode } = useBarcodeScanner(enabled, onDetected, initialSuppressedCode);
  const videoBoxClassName = fillHeight ? 'flex-1 min-h-0' : aspectClassName;
  return (
    <div className={`card overflow-hidden ${fillHeight ? 'flex h-full flex-col' : ''}`}>
      <div className="flex shrink-0 items-center gap-2 border-b p-4">
        <ScanLine className="shrink-0 text-blue-600" size={20} />
        <div className="min-w-0"><h2 className="font-bold">{title}</h2><p className="truncate text-xs text-slate-500">{description}</p></div>
      </div>
      <div className={`relative bg-black ${fillHeight ? 'flex-1' : ''}`}>
        {error ? (
          <div className={`flex ${videoBoxClassName} flex-col items-center justify-center gap-3 p-8 text-center text-red-300`}>
            <CameraOff size={28} />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <video ref={videoRef} className={`${videoBoxClassName} h-full w-full object-cover`} muted playsInline />
        )}
        {flashCode && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80">
            <p className="flex items-center gap-2 text-base font-semibold text-white"><CheckCircle2 size={22} /> Qo‘shildi</p>
          </div>
        )}
      </div>
    </div>
  );
}
