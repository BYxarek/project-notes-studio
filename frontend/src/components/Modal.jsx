import { useEffect } from 'react'
import { X } from 'lucide-react'

function Modal({ title, icon, closeText, onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>
            {icon}
            <span>{title}</span>
          </h3>
          <button className="icon-btn" onClick={onClose} title={closeText} aria-label={closeText}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
