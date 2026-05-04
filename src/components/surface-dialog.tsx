import { useEffect } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'

interface SurfaceDialogProps extends PropsWithChildren {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  onClose: () => void
  width?: 'narrow' | 'medium' | 'wide'
}

export function SurfaceDialog({
  eyebrow,
  title,
  description,
  actions,
  onClose,
  width = 'medium',
  children,
}: SurfaceDialogProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      aria-modal
      className="brand-modal-overlay command-surface-overlay"
      role="dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className={`brand-modal surface-dialog surface-dialog-${width}`}>
        <header className="surface-dialog-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h3>{title}</h3>
            {description ? <p className="surface-dialog-copy">{description}</p> : null}
          </div>
          <button aria-label="סגירת חלון" className="ghost-button" onClick={onClose} type="button">
            סגור
          </button>
        </header>
        <div className="surface-dialog-body">{children}</div>
        {actions ? <footer className="surface-dialog-actions">{actions}</footer> : null}
      </section>
    </div>
  )
}
