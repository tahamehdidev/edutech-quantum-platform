import { useId, useState } from "react";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";
import "./ConfirmDeleteModal.css";

// A real type-the-name-to-confirm dialog (02-api-contract.md §3.5's cascading-delete
// confirmation), not a stock confirm(). The confirm button stays disabled until the typed text
// matches resourceName exactly -- this is the actual safeguard, not just a second click.
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  resourceName,
  resourceLabel = "item",
  warningText,
  isDeleting = false,
}) {
  const [typedName, setTypedName] = useState("");
  const inputId = useId();
  const isMatch = typedName === resourceName;

  function handleClose() {
    setTypedName("");
    onClose();
  }

  function handleConfirm() {
    if (!isMatch) return;
    onConfirm();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Delete this ${resourceLabel}?`}>
      {warningText ? <p className="confirm-delete__warning">{warningText}</p> : null}
      <p className="confirm-delete__instruction">
        Type <strong className="font-mono">{resourceName}</strong> to confirm.
      </p>
      <label htmlFor={inputId} className="confirm-delete__label">
        {resourceLabel} name
      </label>
      <input
        id={inputId}
        type="text"
        className="confirm-delete__input"
        value={typedName}
        onChange={(event) => setTypedName(event.target.value)}
        autoComplete="off"
        autoFocus
      />
      <div className="confirm-delete__actions">
        <Button type="button" variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={!isMatch}
          isLoading={isDeleting}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
