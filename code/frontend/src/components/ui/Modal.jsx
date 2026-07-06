import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./Modal.css";

// Native <dialog> gives focus-trapping, ESC-to-close, and top-layer stacking for free -- no
// portal or hand-rolled focus trap needed (impeccable's "prefer native/system controls" rule).
export function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onClose}
      onCancel={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
    >
      <div className="modal__header">
        <h2 id="modal-title" className="modal__title">
          {title}
        </h2>
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="modal__body">{children}</div>
    </dialog>
  );
}
