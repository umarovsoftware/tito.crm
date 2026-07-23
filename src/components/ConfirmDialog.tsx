import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmDialog({ open, title = 'Tasdiqlash', message, onConfirm, onClose, loading = false }: { open: boolean; title?: string; message: string; onConfirm: () => void; onClose: () => void; loading?: boolean }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertTriangle className="shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Bekor qilish</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'O‘chirilmoqda...' : 'Ha, o‘chirish'}</button>
      </div>
    </Modal>
  );
}
