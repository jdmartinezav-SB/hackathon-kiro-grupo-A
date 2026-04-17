import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  Children,
  type ReactNode,
} from 'react';

export interface SbTabsProps {
  /** Índice del tab activo (0-based). */
  activeTab: number;
  /** Callback cuando el usuario selecciona un tab. */
  onTabChange?: (index: number) => void;
  /** Array de labels para cada tab. */
  tabs: string[];
  /** Paneles de contenido — uno por tab. */
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-tabs>`.
 *
 * Gestiona el tab activo en React y muestra únicamente el panel
 * correspondiente al índice seleccionado.
 */
export const SbTabs = forwardRef<HTMLElement, SbTabsProps>(
  (
    {
      activeTab,
      onTabChange,
      tabs,
      children,
      className,
      'data-testid': dataTestId,
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    const handleTabChange = useCallback(
      (e: Event) => {
        const index =
          (e as CustomEvent).detail?.index ??
          (e as CustomEvent).detail?.tab ??
          undefined;
        if (typeof index === 'number') {
          onTabChange?.(index);
        }
      },
      [onTabChange],
    );

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      el.addEventListener('sb-tab-change', handleTabChange);
      el.addEventListener('change', handleTabChange);

      return () => {
        el.removeEventListener('sb-tab-change', handleTabChange);
        el.removeEventListener('change', handleTabChange);
      };
    }, [handleTabChange]);

    const panels = Children.toArray(children);

    return (
      <div className={className} data-testid={dataTestId}>
        <sb-ui-tabs ref={innerRef} active-tab={activeTab}>
          {tabs.map((label, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => onTabChange?.(i)}
            >
              {label}
            </button>
          ))}
        </sb-ui-tabs>

        {panels.map((panel, i) => (
          <div
            key={i}
            role="tabpanel"
            hidden={i !== activeTab}
            data-testid={`tab-panel-${i}`}
          >
            {i === activeTab ? panel : null}
          </div>
        ))}
      </div>
    );
  },
);

SbTabs.displayName = 'SbTabs';
