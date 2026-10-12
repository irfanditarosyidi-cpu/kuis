"use client";

import { useEffect, useId, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Trash2, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  detail?: ReactNode;
  confirmLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel,
  loadingLabel = "Memproses...",
  cancelLabel = "Batal",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return <div className="overlay confirm-overlay" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !loading) onCancel();
  }}>
    <section
      className={`confirm-dialog confirm-dialog-${tone}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="confirm-dialog-head">
        <span className="confirm-dialog-icon" aria-hidden="true">
          {tone === "danger" ? <AlertTriangle size={23} /> : <CheckCircle2 size={23} />}
        </span>
        <div className="confirm-dialog-copy">
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        <button className="icon-btn confirm-dialog-close" type="button" onClick={onCancel} disabled={loading} aria-label="Tutup dialog">
          <X size={17} />
        </button>
      </div>
      {detail && <div className="confirm-dialog-detail">{detail}</div>}
      <div className="confirm-dialog-actions">
        <button className="btn btn-light" type="button" onClick={onCancel} disabled={loading} autoFocus>{cancelLabel}</button>
        <button className={`btn ${tone === "danger" ? "btn-danger-solid" : "btn-primary"}`} type="button" onClick={onConfirm} disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={17} /> : tone === "danger" ? <Trash2 size={17} /> : <CheckCircle2 size={17} />}
          {loading ? loadingLabel : confirmLabel}
        </button>
      </div>
    </section>
  </div>;
}
