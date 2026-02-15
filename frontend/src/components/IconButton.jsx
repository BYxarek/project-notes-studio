function IconButton({ title, icon, onClick, danger = false, disabled = false }) {
  return (
    <button
      className={`icon-btn ${danger ? 'danger' : ''}`}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  )
}

export default IconButton
