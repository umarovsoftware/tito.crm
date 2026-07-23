import { CameraOff, CheckCircle2 } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { Modal } from './Modal';

export function BarcodeScannerModal({ open, onClose, onDetected, continuous = false }: { open: boolean; onClose: () => void; onDetected: (code: string) => void; continuous?: boolean }) {
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  onDetectedRef.current = onDetected;
  onCloseRef.current = onClose;

  const handleDetected = useCallback((code: string) => {
    onDetectedRef.current(code);
    if (!continuous) onCloseRef.current();
  }, [continuous]);

  const { videoRef, error, flashCode } = useBarcodeScanner(open, handleDetected);

  return (
    <Modal open={open} title={continuous ? 'Ketma-ket skanerlash' : 'Kodni skanerlash'} onClose={onClose}>
      <div className="space-y-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-50 p-8 text-center text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <CameraOff size={32} />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            {flashCode && continuous && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80">
                <p className="flex items-center gap-2 text-lg font-semibold text-white"><CheckCircle2 size={26} /> Qo‘shildi</p>
              </div>
            )}
          </div>
        )}
        <p className="text-center text-xs text-slate-500">
          {continuous ? 'Kamera doimiy ochiq turadi — mahsulotlarni birin-ketin skanerlayvering. Tugatgach "Yopish" tugmasini bosing.' : 'Shtrix-kod yoki QR kodni kamera oldiga tuting — aniqlangach avtomatik yopiladi.'}
        </p>
        <button type="button" className="btn-secondary w-full" onClick={onClose}>{continuous ? 'Yopish' : 'Bekor qilish'}</button>
      </div>
    </Modal>
  );
}
