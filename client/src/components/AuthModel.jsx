import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { FaTimes } from 'react-icons/fa'
import Auth from '../pages/Auth'

function AuthModel({ onClose }) {
  const { userData } = useSelector((state) => state.user)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (userData) onClose()
  }, [userData, onClose])

  useEffect(() => {
    const previousFocus = document.activeElement
    const getFocusable = () => dialogRef.current?.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    ) || []

    getFocusable()[0]?.focus()
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to InterviewIQ.AI"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close sign-in dialog">
          <FaTimes aria-hidden="true" />
        </button>
        <Auth isModel />
      </section>
    </div>
  )
}

export default AuthModel
