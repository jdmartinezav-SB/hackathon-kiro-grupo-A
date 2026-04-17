import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  type ReactNode,
} from 'react';

export interface SbModalProps {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-modal>`.
 *
 * Escucha eventos nativos de cierre (Escape, click fuera) y los
 * re-emite como callback `onClose` de React.
 */
export const SbModal = forwardRef<HTMLElement, SbModalProps>(
  (
    {
      open,
      title,
      onClose,
      children,
      className,
      'data-testid': dataTestId,
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    const handleClose = useCallback(() => {
      onClose?.();
    }, [onClose]);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      el.addEventListener('sb-close', handleClose);
      el.addEventListener('close', handleClose);

      return () => {
        el.removeEventListener('sb-close', handleClose);
        el.removeEventListener('close', handleClose);
      };
    }, [handleClose]);

    /* Cerrar con Escape a nivel de documento cuando el modal está abierto */
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose?.();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, onClose]);

    return (
      <sb-ui-modal
        ref={innerRef}
        open={open || undefined}
        title={title}
        className={className}
        data-testid={dataTestId}
      >
        {children}
      </sb-ui-modal>
    );
  },
);

SbModal.displayName = 'SbModal';
