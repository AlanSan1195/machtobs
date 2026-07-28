import React, { useEffect, useRef } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCancel();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      className="glass-card w-[min(92vw,640px)] rounded-none border-paper/20 bg-background p-0 text-text shadow-2xl shadow-black/60"
    >
      <div className="p-6">
        <h2 className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary">{title}</h2>
        <div className="mb-6 space-y-3 text-sm leading-relaxed text-paper/80">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-none border border-paper/20 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-paper/70 transition-colors hover:border-paper/50 hover:text-paper"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-none bg-primary px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
