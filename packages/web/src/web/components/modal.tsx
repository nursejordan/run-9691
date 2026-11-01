import { useEffect, useRef, type ReactNode } from "react";
export function Modal({
  label,
  close,
  className = "",
  children,
}: {
  label: string;
  close: () => void;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="overlay native-modal"
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className={`dialog ${className}`}>{children}</div>
    </dialog>
  );
}
