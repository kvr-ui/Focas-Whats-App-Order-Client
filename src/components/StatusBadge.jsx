import { STATUS_STYLES } from '../format'

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  )
}

export default StatusBadge
